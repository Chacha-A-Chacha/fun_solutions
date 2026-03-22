import { Suspense } from "react";
import { getSettings } from "@/app/lib/utils/settings";
import LoginTabs from "@/components/LoginTabs";
import PoweredByFooter from "@/components/PoweredByFooter";
import { Card, CardContent } from "@/components/ui/card";
import { Info } from "lucide-react";

export const metadata = {
  title: "IYF We Can Academy - Session Scheduler",
  description: "Log in to book your practical sessions",
};

export default async function LoginPage() {
  const settings = await getSettings();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-blue-900 to-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-md mx-auto w-full">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-block bg-blue-950 rounded-2xl px-6 py-3 shadow-lg mb-3">
            <img
              src="/App-Logo.png"
              alt="IYF We Can Academy"
              className="h-20 w-auto"
            />
          </div>
          <p className="text-blue-200 text-sm">
            Book your practical driving sessions
          </p>
        </div>

        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardContent className="pt-6 space-y-6">
            <Suspense fallback={null}>
              <LoginTabs />
            </Suspense>

            {/* Inline guidelines */}
            <div className="bg-blue-950/5 rounded-lg p-3 border border-blue-900/10">
              <div className="flex items-center gap-1.5 text-sm font-medium text-blue-900 mb-1.5">
                <Info className="w-4 h-4 text-blue-700" />
                Session Guidelines
              </div>
              <ul className="text-xs text-slate-600 space-y-0.5 ml-5.5 list-disc">
                <li>Available Monday–Thursday &amp; weekends</li>
                <li>Select up to {settings.max_days_per_week} days per week</li>
                <li>
                  Maximum {settings.max_capacity_per_session} students per
                  session
                </li>
                <li>{settings.max_sessions_per_day === 1 ? 'One session per day' : `Up to ${settings.max_sessions_per_day} sessions per day`}</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative mt-10">
        <PoweredByFooter variant="light" />
      </div>
    </div>
  );
}
