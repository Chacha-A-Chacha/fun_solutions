import AuthForm from '@/components/AuthForm';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Info, ExternalLink } from 'lucide-react';

export const metadata = {
  title: 'Student Session Scheduler - Login',
  description: 'Log in to book your practical sessions',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto w-full grid md:grid-cols-2 gap-8">
        {/* Login Card */}
        <Card className="w-full shadow-2xl">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center text-gray-900">
              Student Session Scheduler
            </CardTitle>
            <CardDescription className="text-center text-gray-600">
              Book your practical sessions with ease
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AuthForm />
          </CardContent>
        </Card>

        {/* Information Section */}
        <Card className="w-full shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-6 h-6 text-blue-600" />
              Session Guidelines
            </CardTitle>
            <CardDescription>
              Key details about booking your practical sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>Session Availability</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc pl-4 space-y-2 text-sm text-gray-600">
                    <li>Available Monday-Thursday: 8-10am, 10am-12pm, 1-3pm, 3-5pm</li>
                    <li>Weekend slots: 9-11am, 11am-1pm, 2-4pm, 4-6pm</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Booking Limits</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc pl-4 space-y-2 text-sm text-gray-600">
                    <li>Select sessions on 3 different days</li>
                    <li>One session per day</li>
                    <li>Maximum 4 students per session</li>
                    <li>Modify selections until all spots are filled</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="mt-12 text-center">
        <p className="text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Chacha Technologies. All rights reserved.
        </p>
        <div className="text-sm text-gray-500">

        <a 
            href="/instructor?instructor_key=demo_instructor_access" 
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            Instructor Dashboard <ExternalLink className="w-4 h-4" />
        </a>
        </div>
        <div className="flex justify-center items-center space-x-4 mt-4">
          <a 
            href="https://www.chach-a.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="group flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
          >
            <span className="text-xs text-gray-600 group-hover:text-gray-800 transition-colors">
              Powered by
            </span>
            <img 
              src="https://www.chach-a.com/logoMark.svg" 
              alt="Chacha Technologies Logo" 
              className="transform h-7 w-auto group-hover:scale-110 transition-transform duration-300" 
            />
            <span className="text-sm font-medium text-gray-800 group-hover:text-black">
              Chacha Technologies
            </span>
          </a>
        </div>
      </footer>
    </div>
  );
}
