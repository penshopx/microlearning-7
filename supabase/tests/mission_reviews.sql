\set owner '00000000-0000-4000-8000-000000000001'
\set participant '00000000-0000-4000-8000-000000000002'
\set supervisor '00000000-0000-4000-8000-000000000003'
\set outsider '00000000-0000-4000-8000-000000000004'
\set other_participant '00000000-0000-4000-8000-000000000005'
\set course '10000000-0000-4000-8000-000000000001'
\set module '20000000-0000-4000-8000-000000000001'
\set progress '30000000-0000-4000-8000-000000000001'
\set path '00000000-0000-4000-8000-000000000002/10000000-0000-4000-8000-000000000001/20000000-0000-4000-8000-000000000001/photo/proof.png'
CREATE FUNCTION public.test_assert(ok BOOLEAN, message TEXT) RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'FAIL: %', message; END IF; END $$;
INSERT INTO auth.users VALUES (:'owner'),(:'participant'),(:'supervisor'),(:'outsider'),(:'other_participant');
INSERT INTO public.courses(id,user_id) VALUES (:'course',:'owner');
INSERT INTO public.course_modules VALUES (:'module',:'course','Praktik aman');
INSERT INTO public.module_content(module_id,content_type,content_data)
VALUES (:'module','worksheet','{"kind":"workplace-mission","evidence":[{"id":"photo","required":true}]}');
INSERT INTO storage.objects(bucket_id,name) VALUES ('mission-evidence',:'path'),('mission-evidence',:'path'||'.unsubmitted');
-- Fixture insert precedes the new completion validator intentionally.
ALTER TABLE public.learner_progress DISABLE TRIGGER validate_workplace_mission_evidence;
INSERT INTO public.learner_progress(id,user_id,course_id,module_id,status,mission_progress)
VALUES (:'progress',:'participant',:'course',:'module','completed',
  jsonb_build_object('feedback','I checked the work','evidenceUploads',jsonb_build_array(jsonb_build_object(
    'evidenceId','photo','storagePath',:'path','fileName','proof.png','mimeType','image/png','sizeBytes',32,'uploadedAt',now()))));
-- The same participant's proof in another course is not in this assignment.
INSERT INTO public.courses(id,user_id) VALUES ('10000000-0000-4000-8000-000000000002',:'owner');
INSERT INTO public.course_modules VALUES ('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','Other course');
INSERT INTO storage.objects(bucket_id,name) VALUES ('mission-evidence',
  '00000000-0000-4000-8000-000000000002/10000000-0000-4000-8000-000000000002/20000000-0000-4000-8000-000000000002/photo/private.png');
INSERT INTO public.learner_progress(user_id,course_id,module_id,status,mission_progress)
VALUES (:'participant','10000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002','completed',
  '{"evidenceUploads":[{"evidenceId":"photo","storagePath":"00000000-0000-4000-8000-000000000002/10000000-0000-4000-8000-000000000002/20000000-0000-4000-8000-000000000002/photo/private.png"}]}');
ALTER TABLE public.learner_progress ENABLE TRIGGER validate_workplace_mission_evidence;
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', :'owner', false);
INSERT INTO public.mission_supervisor_assignments(course_id,participant_id,supervisor_id)
VALUES (:'course',:'participant',:'supervisor');
SELECT public.test_assert((SELECT count(*) = 1 FROM public.mission_supervisor_assignments),'owner manages scope without recursive policy');
SELECT public.test_assert(NOT public.can_open_mission_evidence(:'path'),'owner has no implicit evidence access');
SELECT set_config('request.jwt.claim.sub', :'supervisor', false);
SELECT public.test_assert((SELECT count(*) = 1 FROM public.courses),'assigned supervisor sees private course');
SELECT public.test_assert(jsonb_array_length(public.get_mission_review_submissions(:'course')) = 1,'scoped submission is listed');
SELECT public.test_assert(jsonb_array_length(public.get_mission_review_submissions('10000000-0000-4000-8000-000000000002')) = 0,
  'assignment does not expose the same participant in another course');
SELECT public.test_assert((SELECT count(*) = 1 FROM storage.objects),'only submitted object visible');
SELECT public.test_assert(NOT public.can_open_mission_evidence(:'path'||'.unsubmitted'),'unsubmitted object denied');
SELECT public.test_assert(public.review_mission_evidence(:'progress','approved','Good work')->>'status' = 'approved','approve stored');
DO $$ BEGIN
  BEGIN
    PERFORM public.review_mission_evidence('30000000-0000-4000-8000-000000000001','retry_requested','');
    RAISE EXCEPTION 'FAIL: blank retry accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE 'FAIL:%' THEN RAISE; END IF;
  END;
END $$;
SELECT public.test_assert(public.review_mission_evidence(:'progress','retry_requested','Periksa ulang sambungan')->>'feedback' = 'Periksa ulang sambungan','retry coaching stored');
SELECT set_config('request.jwt.claim.sub', :'outsider', false);
SELECT public.test_assert(jsonb_array_length(public.get_mission_review_submissions(:'course')) = 0,'unrelated supervisor cannot list');
SELECT public.test_assert((SELECT count(*) = 0 FROM storage.objects),'outsider cannot open evidence');
SELECT public.test_assert((SELECT count(*) = 0 FROM public.mission_evidence_reviews),'outsider cannot read review');
DO $$ BEGIN
  BEGIN
    PERFORM public.review_mission_evidence('30000000-0000-4000-8000-000000000001','approved','Forged');
    RAISE EXCEPTION 'FAIL: unauthorized review accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE 'FAIL:%' THEN RAISE; END IF;
  END;
  BEGIN
    INSERT INTO public.mission_supervisor_assignments(course_id,participant_id,supervisor_id)
    VALUES ('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000004');
    RAISE EXCEPTION 'FAIL: self-assignment accepted';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $$;
SELECT set_config('request.jwt.claim.sub', :'other_participant', false);
SELECT public.test_assert((SELECT count(*) = 0 FROM storage.objects),'unrelated participant cannot open');
SELECT public.test_assert((SELECT count(*) = 0 FROM public.mission_evidence_reviews),'unrelated participant cannot read coaching');
SELECT set_config('request.jwt.claim.sub', :'participant', false);
SELECT public.test_assert((SELECT feedback = 'Periksa ulang sambungan' FROM public.mission_evidence_reviews),'participant sees review');
DO $$ BEGIN
  BEGIN
    UPDATE public.mission_evidence_reviews SET status = 'approved';
    RAISE EXCEPTION 'FAIL: participant forged approval';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $$;
SELECT public.test_assert((public.restart_mission_practice(:'progress')).status = 'in_progress','participant can restart retry');
SELECT public.test_assert((SELECT count(*) = 1 FROM public.mission_evidence_reviews),'feedback retained while revising');
SELECT set_config('request.jwt.claim.sub', :'supervisor', false);
SELECT public.test_assert(jsonb_array_length(public.get_mission_review_submissions(:'course')) = 0,'draft retry not listed');
SELECT public.test_assert((SELECT count(*) = 0 FROM storage.objects),'draft retry not exposed');
SELECT set_config('request.jwt.claim.sub', :'participant', false);
SELECT mission_progress AS saved_progress FROM public.learner_progress WHERE id = :'progress' \gset
SELECT public.upsert_learner_progress_atomic(:'course',:'module','completed',100,NULL,NULL,NULL,:'saved_progress'::jsonb);
SELECT public.test_assert((SELECT count(*) = 0 FROM public.mission_evidence_reviews),'resubmission clears old retry decision');
SELECT set_config('request.jwt.claim.sub', :'supervisor', false);
SELECT public.review_mission_evidence(:'progress','approved','Now correct');
SELECT set_config('request.jwt.claim.sub', :'participant', false);
DO $$ BEGIN
  BEGIN
    UPDATE public.learner_progress SET status='in_progress' WHERE id = '30000000-0000-4000-8000-000000000001';
    RAISE EXCEPTION 'FAIL: approved practice reopened';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE 'FAIL:%' THEN RAISE; END IF;
  END;
END $$;
SELECT set_config('request.jwt.claim.sub', :'owner', false);
DELETE FROM public.mission_supervisor_assignments;
SELECT set_config('request.jwt.claim.sub', :'supervisor', false);
SELECT public.test_assert((SELECT count(*) = 0 FROM storage.objects),'revoked supervisor cannot open');
SELECT public.test_assert((SELECT count(*) = 0 FROM public.mission_evidence_reviews),'revoked supervisor cannot read review');
SELECT public.test_assert(jsonb_array_length(public.get_mission_review_submissions(:'course')) = 0,'revocation removes inbox');
RESET ROLE;
\echo 'All supervisor review policy and retry lifecycle checks passed.'
