-- Fix RLS Policy for chat_conversations to allow anonymous/guest users

-- 1. Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can create their own conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Users can view their own conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON chat_conversations;

-- 2. Create new permissive policies that allow anonymous users

-- Allow anyone (authenticated OR anonymous) to create conversations
CREATE POLICY "Anyone can create conversations" 
ON chat_conversations 
FOR INSERT 
TO public
WITH CHECK (true);

-- Allow users to view their own conversations (by user_id OR by session)
CREATE POLICY "Users can view their own conversations" 
ON chat_conversations 
FOR SELECT 
TO public
USING (
  auth.uid() = user_id 
  OR user_id IS NULL -- Allow viewing anonymous conversations
);

-- Allow users to update their own conversations
CREATE POLICY "Users can update their own conversations" 
ON chat_conversations 
FOR UPDATE 
TO public
USING (
  auth.uid() = user_id 
  OR user_id IS NULL -- Allow updating anonymous conversations
);

-- 3. Fix chat_messages policies similarly
DROP POLICY IF EXISTS "Users can view messages from their conversations" ON chat_messages;
DROP POLICY IF EXISTS "Users can create messages in their conversations" ON chat_messages;

-- Allow anyone to create messages
CREATE POLICY "Anyone can create messages" 
ON chat_messages 
FOR INSERT 
TO public
WITH CHECK (true);

-- Allow viewing messages from accessible conversations
CREATE POLICY "Users can view messages from their conversations" 
ON chat_messages 
FOR SELECT 
TO public
USING (
  EXISTS (
    SELECT 1 FROM chat_conversations 
    WHERE id = chat_messages.conversation_id 
    AND (auth.uid() = user_id OR user_id IS NULL)
  )
);

-- Refresh schema
NOTIFY pgrst, 'reload schema';

SELECT 'RLS policies updated - anonymous chat now allowed!' as message;