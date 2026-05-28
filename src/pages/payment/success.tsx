import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function PaymentSuccess() {
  const router = useRouter();
  const { order_id } = router.query;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (order_id) {
      // Give webhook some time to process
      const timer = setTimeout(() => {
        setLoading(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [order_id]);

  return (
    <>
      <Head>
        <title>Payment Success - Chaesa Live</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          {loading ? (
            <>
              <Loader2 className="w-16 h-16 mx-auto mb-4 text-blue-600 animate-spin" />
              <h1 className="text-2xl font-bold mb-2">Processing Payment...</h1>
              <p className="text-gray-600 mb-4">
                Please wait while we confirm your payment.
              </p>
            </>
          ) : error ? (
            <>
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 text-3xl">✕</span>
              </div>
              <h1 className="text-2xl font-bold mb-2 text-red-600">
                Payment Failed
              </h1>
              <p className="text-gray-600 mb-6">{error}</p>
              <Link href="/pricing">
                <Button className="w-full">Try Again</Button>
              </Link>
            </>
          ) : (
            <>
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600" />
              <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
              <p className="text-gray-600 mb-2">
                Thank you for subscribing to Chaesa Live Pro!
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Order ID: {order_id}
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold text-blue-900 mb-2">
                  What's Next?
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>✓ Your subscription is now active</li>
                  <li>✓ Start unlimited meetings</li>
                  <li>✓ Access all premium features</li>
                  <li>✓ Cloud recording enabled</li>
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
            </>
          )}
        </Card>
      </div>
    </>
  );
}