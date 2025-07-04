import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { notifyError } from '@utils/toast';

const AuthError = () => {
  const router = useRouter();
  const { error } = router.query;

  useEffect(() => {
    if (error) {
      notifyError(decodeURIComponent(error));
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    } else {
      router.push('/auth/login');
    }
  }, [error, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h1>
        <p className="text-gray-600">Redirecting to login page...</p>
      </div>
    </div>
  );
};

export default AuthError; 