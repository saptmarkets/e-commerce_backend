import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { FiLock, FiMail } from "react-icons/fi";
import useTranslation from "next-translate/useTranslation";

//internal  import
import Layout from "@layout/Layout";
import Error from "@components/form/Error";
import useLoginSubmit from "@hooks/useLoginSubmit";
import InputArea from "@components/form/InputArea";
import BottomNavigation from "@components/login/BottomNavigation";

const Login = () => {
  const router = useRouter();
  const { t } = useTranslation('common');
  const { handleSubmit, submitHandler, register, errors, loading } = useLoginSubmit();

  // Handle error from URL
  useEffect(() => {
    const { error } = router.query;
    if (error) {
      // You can use your notification system here to show the error
      console.error("Login error:", decodeURIComponent(error));
    }
  }, [router.query]);

  return (
    <Layout title={t('loginTitle')} description={t('loginTitle')}>
      <div className="mx-auto max-w-screen-2xl px-3 sm:px-10">
        <div className="py-4 flex flex-col lg:flex-row w-full">
          <div className="w-full sm:p-5 lg:p-8">
            <div className="mx-auto text-left justify-center rounded-md w-full max-w-lg px-4 py-8 sm:p-10 overflow-hidden align-middle transition-all transform bg-white shadow-xl rounded-2x">
              <div className="overflow-hidden mx-auto">
                <div className="text-center mb-6">
                  <h2 className="text-3xl font-bold font-serif">{t('loginTitle')}</h2>
                  <p className="text-sm md:text-base text-gray-500 mt-2 mb-8 sm:mb-10">
                    {t('loginWithYourEmail')}
                  </p>
                </div>
                <form
                  onSubmit={handleSubmit(submitHandler)}
                  className="flex flex-col justify-center"
                >
                  <div className="grid grid-cols-1 gap-5">
                    <div className="form-group">
                      <InputArea
                        register={register}
                        label={t('email')}
                        name="email"
                        type="email"
                        placeholder={t('email')}
                        Icon={FiMail}
                        autocomplete="email"
                      />
                      <Error errorName={errors.email} />
                    </div>
                    <div className="form-group">
                      <InputArea
                        register={register}
                        label={t('password')}
                        name="password"
                        type="password"
                        placeholder={t('password')}
                        Icon={FiLock}
                        autocomplete="current-password"
                      />
                      <Error errorName={errors.password} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-sm text-gray-900">
                          {t('rememberMe')}
                        </label>
                      </div>
                      <div className="text-sm">
                        <Link
                          href="/auth/forget-password"
                          className="font-medium text-emerald-600 hover:text-emerald-500"
                        >
                          {t('forgotPassword')}
                        </Link>
                      </div>
                    </div>

                    <button
                      disabled={loading}
                      type="submit"
                      className="w-full text-center py-3 rounded bg-emerald-500 text-white hover:bg-emerald-600 transition-all focus:outline-none my-1"
                    >
                      {loading ? t('loading') : t('loginBtn')}
                    </button>
                  </div>
                </form>

                <BottomNavigation />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Login;
