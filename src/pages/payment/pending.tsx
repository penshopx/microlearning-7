import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function PaymentPending() {
  const router = useRouter();
  const { order_id } = router.query;

  return (
    <>
      <Head>
        <title>Payment Pending - Chaesa Live</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <Clock className="w-16 h-16 mx-auto mb-4 text-yellow-600" />
          <h1 className="text-2xl font-bold mb-2">Payment Pending</h1>
          <p className="text-gray-600 mb-2">
            Your payment is being processed. This may take a few moments.
          </p>
          {order_id && (
            <p className="text-sm text-gray-500 mb-6">Order ID: {order_id}</p>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-yellow-900 mb-2">
              What's Happening?
            </h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Bank transfer may take 1-2 business days</li>
              <li>• E-wallet payments are usually instant</li>
              <li>• You'll receive email confirmation</li>
              <li>• Check your dashboard for updates</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Link href="/" className="flex-1">
              <Button variant="outline" className="w-full">
                Go Home
              </Button>
            </Link>
            <Link href="/dashboard" className="flex-1">
              <Button className="w-full">View Dashboard</Button>
            </Link>
          </div>
        </Card>
      </div>
    </>
  );
}