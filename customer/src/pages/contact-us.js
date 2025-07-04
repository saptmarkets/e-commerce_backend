import React from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import useTranslation from "next-translate/useTranslation";
import { FiMail, FiMapPin, FiBell, FiPhone, FiClock, FiSend } from "react-icons/fi";

//internal import
import Layout from "@layout/Layout";
import Label from "@components/form/Label";
import Error from "@components/form/Error";
import { notifySuccess } from "@utils/toast";
import useGetSetting from "@hooks/useGetSetting";
import InputArea from "@components/form/InputArea";
import PageHeader from "@components/header/PageHeader";
import CMSkeleton from "@components/preloader/CMSkeleton";
import useUtilsFunction from "@hooks/useUtilsFunction";

const ContactUs = () => {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const { showingTranslateValue } = useUtilsFunction();
  const { storeCustomizationSetting, loading, error } = useGetSetting();

  const submitHandler = () => {
    notifySuccess(
      "your message sent successfully. We will contact you shortly."
    );
  };

  return (
    <Layout title="Contact Us" description="This is contact us page">
      {/* Hero Section */}
      {(() => {
        const cu = storeCustomizationSetting?.contact_us || {};
        const hasBg = cu.header_bg;
        const bgStyle = hasBg
          ? {
              backgroundImage: `url(${cu.header_bg})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : {};
        const bgClasses = hasBg ? "" : "bg-gradient-to-br from-teal-50 to-cyan-100";
        return (
          <div className={`${bgClasses} relative py-20`} style={bgStyle}>
            {hasBg && <div className="absolute inset-0 bg-white/60 backdrop-brightness-95"></div>}
            <div className="relative max-w-screen-2xl mx-auto px-4 sm:px-10">
              <div className="text-center max-w-4xl mx-auto">
                <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
                  {showingTranslateValue(cu.title) || "Contact Us"}
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  We'd love to hear from you. Get in touch with our team for any questions or support.
                </p>
                <div className="mt-8 flex items-center justify-center space-x-2 text-gray-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium">We respond within 24 hours</span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Contact Methods */}
      <div className="bg-white py-20">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-10">
          
          {/* Contact Info Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            {/* Email Card */}
            {loading ? (
              <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
                <CMSkeleton count={5} height={20} loading={loading} />
              </div>
            ) : (
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl p-8 text-center shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <FiMail className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {showingTranslateValue(storeCustomizationSetting?.contact_us?.email_box_title)}
                </h3>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {showingTranslateValue(storeCustomizationSetting?.contact_us?.email_box_text)}
                </p>
                <a
                  href={`mailto:${storeCustomizationSetting?.contact_us?.email_box_email}`}
                  className="inline-flex items-center text-blue-600 font-semibold hover:text-blue-700 transition-colors"
                >
                  <FiMail className="w-4 h-4 mr-2" />
                  {showingTranslateValue(storeCustomizationSetting?.contact_us?.email_box_email)}
                </a>
              </div>
            )}

            {/* Phone Card */}
            {loading ? (
              <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
                <CMSkeleton count={5} height={20} loading={loading} />
              </div>
            ) : (
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-3xl p-8 text-center shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <FiPhone className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {showingTranslateValue(storeCustomizationSetting?.contact_us?.call_box_title)}
                </h3>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {showingTranslateValue(storeCustomizationSetting?.contact_us?.call_box_text)}
                </p>
                <a
                  href={`tel:${storeCustomizationSetting?.contact_us?.call_box_phone}`}
                  className="inline-flex items-center text-green-600 font-semibold hover:text-green-700 transition-colors"
                >
                  <FiPhone className="w-4 h-4 mr-2" />
                  {showingTranslateValue(storeCustomizationSetting?.contact_us?.call_box_phone)}
                </a>
              </div>
            )}

            {/* Address Card */}
            {loading ? (
              <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
                <CMSkeleton count={5} height={20} loading={loading} />
              </div>
            ) : (
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-3xl p-8 text-center shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <FiMapPin className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {showingTranslateValue(storeCustomizationSetting?.contact_us?.address_box_title)}
                </h3>
                <div className="text-gray-600 leading-relaxed space-y-1">
                  <p>{showingTranslateValue(storeCustomizationSetting?.contact_us?.address_box_address_one)}</p>
                  <p>{showingTranslateValue(storeCustomizationSetting?.contact_us?.address_box_address_two)}</p>
                  <p>{showingTranslateValue(storeCustomizationSetting?.contact_us?.address_box_address_three)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Contact Form Section */}
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            
            {/* Left Side - Image and Info */}
            <div className="space-y-8">
              <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-3xl p-8">
                <div className="max-w-md mx-auto">
                  <Image
                    width={400}
                    height={400}
                    src={storeCustomizationSetting?.contact_us?.midLeft_col_img || "/contact-us.png"}
                    alt="Contact Us Illustration"
                    className="w-full h-auto"
                  />
                </div>
              </div>

              {/* Quick Info Cards */}
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center">
                      <FiClock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Business Hours</h4>
                      <p className="text-gray-600 text-sm">Monday - Friday: 9:00 AM - 6:00 PM</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center">
                      <FiBell className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Response Time</h4>
                      <p className="text-gray-600 text-sm">We typically respond within 2-4 hours</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Contact Form */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 lg:p-12">
              <div className="mb-8">
                <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
                  <CMSkeleton
                    count={1}
                    height={35}
                    loading={loading}
                    data={storeCustomizationSetting?.contact_us?.form_title}
                  />
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  <CMSkeleton
                    count={2}
                    height={20}
                    loading={loading}
                    data={storeCustomizationSetting?.contact_us?.form_description}
                  />
                </p>
              </div>

              <form onSubmit={handleSubmit(submitHandler)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label label={t("common:contact-page-form-input-name")} />
                    <InputArea
                      register={register}
                      name="name"
                      type="text"
                      placeholder={t("common:contact-page-form-input-name")}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                    <Error errorName={errors.name} />
                  </div>
                  <div>
                    <Label label={t("common:contact-page-form-input-email")} />
                    <InputArea
                      register={register}
                      name="email"
                      type="email"
                      placeholder={t("common:contact-page-form-input-email")}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                    <Error errorName={errors.email} />
                  </div>
                </div>

                <div>
                  <Label label={t("common:contact-page-form-input-subject")} />
                  <InputArea
                    register={register}
                    name="subject"
                    type="text"
                    placeholder={t("common:contact-page-form-input-subject")}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                  <Error errorName={errors.subject} />
                </div>

                <div>
                  <Label label={t("common:contact-page-form-input-message")} />
                  <textarea
                    {...register("message", {
                      required: `${t("common:contact-page-form-input-message")} is required!`,
                    })}
                    name="message"
                    placeholder={t("common:contact-page-form-input-message")}
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                  />
                  <Error errorName={errors.message} />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-teal-700 hover:to-cyan-700 transition-all duration-200 transform hover:scale-105 inline-flex items-center justify-center"
                >
                  <FiSend className="w-5 h-5 mr-2" />
                  {t("common:contact-page-form-button-send")}
                </button>
              </form>
            </div>
          </div>

          {/* Additional Support CTA */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-8 lg:p-12 mt-20 text-center">
            <h3 className="text-2xl lg:text-3xl font-bold text-white mb-4">
              Need Immediate Assistance?
            </h3>
            <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
              Our customer support team is available to help you with urgent matters and provide immediate assistance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/faq"
                className="bg-white text-gray-900 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-colors inline-flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Check FAQ
              </a>
              <a
                href="#chat"
                className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white hover:text-gray-900 transition-colors inline-flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Live Chat
              </a>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ContactUs;
