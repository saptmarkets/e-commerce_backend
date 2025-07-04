import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Cookies from "js-cookie";
import { useMutation } from "@tanstack/react-query";
import { IoCheckmarkCircle, IoCloseCircle, IoInformationCircle } from "react-icons/io5";
import { jwtDecode } from "jwt-decode";

//internal import
import { notifySuccess, notifyError } from "@utils/toast";
import Loading from "@components/preloader/Loading";
import CustomerServices from "@services/CustomerServices";
import { UserContext } from "@context/UserContext";
import { useContext } from "react";

const EmailVerification = ({ params }) => {
  const [success, setSuccess] = useState("");
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [isVerificationSuccessful, setIsVerificationSuccessful] = useState(false);
  const { dispatch } = useContext(UserContext);
  const router = useRouter();

  const registerMutation = useMutation({
    mutationKey: ["verifyAndRegister", params?.token],
    mutationFn: async (token) => {
      try {
        console.log("Starting email verification for token:", token ? token.substring(0, 20) + '...' : 'no token');
        // Call the endpoint to verify and register
        return await CustomerServices.verifyAndRegisterCustomer(token);
      } catch (error) {
        console.error("Verification error details:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          message: error.response?.data?.message,
          error: error.response?.data?.error,
          debug: error.response?.data?.debug
        });
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Verification successful:", data);
      setIsVerificationSuccessful(true);
      
      // Check if user already existed
      if (data.message && data.message.includes("already exists")) {
        setIsExistingUser(true);
        setSuccess("This email is already registered. You can login now.");
        notifySuccess("Account already exists. You can login now.");
      } else {
        // New registration
        setSuccess("Email verified successfully! Logging you in...");
        notifySuccess("Registration successful!");
      }
      
      // Store user info in cookies and context
      if (data && data.token) {
        const userInfo = {
          id: data._id,
          name: data.name,
          email: data.email,
          token: data.token
        };
        
        Cookies.set("userInfo", JSON.stringify(userInfo), {
          expires: 7,
          path: "/",
          secure: process.env.NODE_ENV === "production",
          sameSite: "Lax"
        });
        
        dispatch({ type: "USER_LOGIN", payload: userInfo });
      } else {
        // If no token, redirect to login
        setTimeout(() => {
          router.push("/auth/login");
        }, 1500);
      }
    },
    onError: (error) => {
      console.error("Registration error:", error);
      
      // Only show error if verification wasn't ultimately successful
      if (!isVerificationSuccessful) {
      let errorMessage = "Email verification failed. Please try signing up again.";
      
      // Handle specific error types
      if (error.response?.data?.error === 'TokenExpiredError') {
        errorMessage = "Verification link has expired. Please sign up again to get a new verification email.";
      } else if (error.response?.data?.error === 'JsonWebTokenError') {
        errorMessage = "Invalid verification link. Please sign up again to get a new verification email.";
      } else if (error.response?.status === 500) {
        errorMessage = "Server error occurred. Please try again later or contact support.";
      } else if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
        errorMessage = "Cannot connect to server. Please make sure the backend server is running and try again.";
      }
      
      notifyError(errorMessage);
      
      // Redirect to signup after a short delay
      setTimeout(() => {
        router.push("/auth/signup");
      }, 4000); // Increased delay to give user time to read the error
    }
    }
  });

  // New useEffect for handling redirection after success
  useEffect(() => {
    if (isVerificationSuccessful) {
      const redirectPath = isExistingUser ? "/auth/login" : "/";
      setTimeout(() => {
        router.push(redirectPath);
      }, 1500);
    } else if (registerMutation.isError && !isVerificationSuccessful) {
      // If there's an error and no successful verification happened, redirect to signup
      setTimeout(() => {
        router.push("/auth/signup");
      }, 4000); // Keep increased delay for error message to be read
    }
  }, [isVerificationSuccessful, isExistingUser, registerMutation.isError, router]);

  // Trigger verification when component mounts
  useEffect(() => {
    if (params?.token) {
      registerMutation.mutate(params.token);
    }
  }, [params?.token]);

  return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md text-center">
        {registerMutation.isPending ? (
          <div className="py-8">
            <Loading loading={registerMutation.isPending} />
            <p className="mt-4 text-gray-600">Verifying your email...</p>
          </div>
        ) : isVerificationSuccessful ? (
          // Always show success if verification was ultimately successful
          isExistingUser ? (
          <div className="text-blue-500 py-8">
            <IoInformationCircle className="mx-auto mb-4 text-6xl" />
            <h2 className="text-2xl font-medium mb-2">Account Already Exists</h2>
            <p className="text-gray-600">This email is already registered.</p>
            <p className="text-gray-600 mt-2">Redirecting you to login page...</p>
          </div>
          ) : (
          <div className="text-emerald-500 py-8">
            <IoCheckmarkCircle className="mx-auto mb-4 text-6xl" />
            <h2 className="text-2xl font-medium mb-2">Email Verified!</h2>
            <p className="text-gray-600">Your account has been successfully created.</p>
            <p className="text-gray-600 mt-2">Redirecting you to the homepage...</p>
          </div>
          )
        ) : registerMutation.isError ? (
          <div className="text-red-500 py-8">
            <IoCloseCircle className="mx-auto mb-4 text-6xl" />
            <h2 className="text-2xl font-medium mb-2">Verification Failed</h2>
            <p className="text-gray-600">
              {registerMutation.error?.response?.data?.message || 
               registerMutation.error?.message || 
               "Something went wrong. Please try signing up again."}
            </p>
            <p className="text-gray-600 mt-2">Redirecting you to signup...</p>
            
            {/* Debug information in development */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-3 bg-gray-100 rounded text-left text-xs">
                <p><strong>Debug Info:</strong></p>
                <p>Status: {registerMutation.error?.response?.status || 'No response'}</p>
                <p>Error Type: {registerMutation.error?.response?.data?.error || 'Unknown'}</p>
                {registerMutation.error?.code === 'NETWORK_ERROR' && (
                  <div className="mt-2 p-2 bg-yellow-100 rounded">
                    <p className="text-yellow-800"><strong>Network Error:</strong></p>
                    <p className="text-yellow-700">Make sure the backend server is running on port 5055</p>
                    <p className="text-yellow-700">Run: <code>cd backend && npm start</code></p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export const getServerSideProps = async ({ params }) => {
  return {
    props: { params },
  };
};

export default EmailVerification;
