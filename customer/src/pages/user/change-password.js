import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import useTranslation from "next-translate/useTranslation";

//internal import
import { getUserSession } from "@lib/auth";
import Error from "@components/form/Error";
import Dashboard from "./dashboard";
import InputArea from "@components/form/InputArea";
import useGetSetting from "@hooks/useGetSetting";
import CustomerServices from "@services/CustomerServices";
import { notifyError, notifySuccess } from "@utils/toast";
import useUtilsFunction from "@hooks/useUtilsFunction";

const ChangePassword = () => {
  const { t } = useTranslation('common');
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();
  const [loading, setLoading] = useState(false);

  const { storeCustomizationSetting } = useGetSetting();
  const { showingTranslateValue } = useUtilsFunction();
  const userInfo = getUserSession();

  const onSubmit = async ({ email, currentPassword, newPassword }) => {
    // return notifySuccess("This Feature is disabled for demo!");

    setLoading(true);
    try {
      const res = await CustomerServices.changePassword({
        email,
        currentPassword,
        newPassword,
      });
      notifySuccess(res.message);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      notifyError(error ? error.response.data.message : error.message);
    }
  };

  useEffect(() => {
    setValue("email", userInfo?.email);
  }, []);

  return (
    <Dashboard
      title={t('changePassword')}
      description={t('changePassword')}
    >
              <h2 className="text-xl font-serif font-semibold mb-5">
        {t('changePassword')}
      </h2>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="md:grid-cols-6 md:gap-6">
          <div className="md:mt-0 md:col-span-2">
            <div className="lg:mt-6 bg-white">
              <div className="grid grid-cols-6 gap-6">
                <div className="col-span-6 sm:col-span-6">
                  <InputArea
                    register={register}
                    label={t('email')}
                    name="email"
                    type="email"
                    autocomplete="username"
                    placeholder={t('email')}
                    readOnly={true}
                  />
                  <Error errorName={errors.email} />
                </div>
                <div className="col-span-6 sm:col-span-6">
                  <InputArea
                    register={register}
                    label={t('currentPassword')}
                    name="currentPassword"
                    type="password"
                    autocomplete="new-password"
                    placeholder={t('currentPassword')}
                  />
                  <Error errorName={errors.currentPassword} />
                </div>
                <div className="col-span-6 sm:col-span-6">
                  <InputArea
                    register={register}
                    label={t('newPassword')}
                    name="newPassword"
                    type="password"
                    autocomplete="new-password"
                    placeholder={t('newPassword')}
                    pattern={
                      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/
                    }
                    patternMessage={[
                      "1. Password must be at least 8 characters long.",
                      "2. Password must contain at least one uppercase letter.",
                      "3. Password must contain at least one lowercase letter.",
                      "4. Password must contain at least one number.",
                      "5. Password must contain at least one special character.",
                    ]}
                  />
                  <Error errorName={errors.newPassword} />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-5 text-right">
          {loading ? (
            <button
              disabled={loading}
              type="submit"
              className="md:text-sm leading-5 inline-flex items-center cursor-pointer transition ease-in-out duration-300 font-medium text-center justify-center border-0 border-transparent rounded-md placeholder-white focus-visible:outline-none focus:outline-none bg-emerald-500 text-white px-5 md:px-6 lg:px-8 py-2 md:py-3 lg:py-3 hover:text-white hover:bg-emerald-600 h-12 mt-1 text-sm lg:text-sm w-full sm:w-auto"
            >
              <img
                src="/loader/spinner.gif"
                alt="Loading"
                width={20}
                height={10}
              />
              <span className="font-serif ml-2 font-light">{t('loading')}</span>
            </button>
          ) : (
            <button
              type="submit"
              className="md:text-sm leading-5 inline-flex items-center cursor-pointer transition ease-in-out duration-300 font-medium text-center justify-center border-0 border-transparent rounded-md placeholder-white focus-visible:outline-none focus:outline-none bg-emerald-500 text-white px-5 md:px-6 lg:px-8 py-2 md:py-3 lg:py-3 hover:text-white hover:bg-emerald-600 h-12 mt-1 text-sm lg:text-sm w-full sm:w-auto"
            >
              {t('updatePassword')}
            </button>
          )}
        </div>
      </form>
    </Dashboard>
  );
};

export default ChangePassword;
