import AuthForm from '@/components/AuthForm';

export const metadata = {
  title: 'Student Session Scheduler - Login',
  description: 'Log in to book your practical sessions',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-extrabold text-gray-900">
          Student Session Scheduler
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          Book your practical sessions
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <AuthForm />
        </div>
        
        <div className="mt-6 bg-white p-4 shadow sm:rounded-lg">
          <h2 className="text-lg font-medium text-gray-900 mb-2">About this system</h2>
          <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
            <li>You can select sessions on 3 different days</li>
            <li>You can select only one session per day</li>
            <li>
              Sessions are available Monday-Thursday (8-10am, 10am-12pm, 1-3pm, 3-5pm)
              and weekends (9-11am, 11am-1pm, 2-4pm, 4-6pm)
            </li>
            <li>Each session has a maximum capacity of 4 students</li>
            <li>You can change your selections until all spots are filled</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
