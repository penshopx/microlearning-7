import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function PaymentFailed() {
  const router = useRouter();
  const { order_id } = router.query;

  return (
    <>
      <Head>
        <title>Payment Failed - Chaesa Live</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <XCircle className="w-16 h-16 mx-auto mb-4 text-red-600" />
          <h1 className="text-2xl font-bold mb-2">Payment Failed</h1>
          <p className="text-gray-600 mb-2">
            Unfortunately, your payment could not be processed.
          </p>
          {order_id && (
            <p className="text-sm text-gray-500 mb-6">Order ID: {order_id}</p>
          )}

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-red-900 mb-2">
              Common Issues:
            </h3>
            <ul className="text-sm text-red-800 space-y-1">
              <li>• Insufficient funds</li>
              <li>• Payment timeout</li>
              <li>• Incorrect card details</li>
              <li>• Bank declined transaction</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Link href="/pricing" className="flex-1">
              <Button className="w-full">Try Again</Button>
            </Link>
            <Link href="/" className="flex-1">
              <Button variant="outline" className="w-full">
                Go Home
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </>
  );
}