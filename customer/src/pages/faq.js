import React from "react";
import Image from "next/image";
import { Disclosure } from "@headlessui/react";
import { ChevronUpIcon } from "@heroicons/react/solid";

//internal import
import Layout from "@layout/Layout";
import useGetSetting from "@hooks/useGetSetting";
import PageHeader from "@components/header/PageHeader";
import useUtilsFunction from "@hooks/useUtilsFunction";

const Faq = () => {
  const { storeCustomizationSetting } = useGetSetting();
  const { showingTranslateValue } = useUtilsFunction();

  return (
    <Layout title="FAQ" description="This is faq page">
      {/* Hero Section */}
      {(() => {
        const faq = storeCustomizationSetting?.faq || {};
        const hasBg = faq.header_bg;
        const bgStyle = hasBg
          ? {
              backgroundImage: `url(${faq.header_bg})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : {};
        const bgClasses = hasBg ? "" : "bg-gradient-to-br from-purple-50 to-pink-100";
        return (
          <div className={`${bgClasses} relative py-20`} style={bgStyle}>
            {hasBg && (
              <div className="absolute inset-0 bg-white/60 backdrop-brightness-95"></div>
            )}
            <div className="relative max-w-screen-2xl mx-auto px-4 sm:px-10">
              <div className="text-center max-w-4xl mx-auto">
                <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
                  {showingTranslateValue(faq.title) || "Frequently Asked Questions"}
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Find answers to common questions about our products and services.
                </p>
                <div className="mt-8 flex items-center justify-center space-x-2 text-gray-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium">Updated regularly</span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Main Content */}
      <div className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-10">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            
            {/* Left Side - Image and Support Info */}
            <div className="space-y-8">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-3xl p-8 text-center">
                <div className="max-w-md mx-auto">
              <Image
                    width={400}
                    height={300}
                src={storeCustomizationSetting?.faq?.left_img || "/faq.png"}
                    alt="FAQ Illustration"
                    className="w-full h-auto"
                  />
                </div>
              </div>

              {/* Support Cards */}
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Live Chat Support</h3>
                      <p className="text-gray-600 text-sm">Available 24/7 for instant help</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-2xl p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Email Support</h3>
                      <p className="text-gray-600 text-sm">We'll respond within 24 hours</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-2xl p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Help Center</h3>
                      <p className="text-gray-600 text-sm">Comprehensive guides and tutorials</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - FAQ Accordion */}
            <div className="space-y-4">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Common Questions</h2>
                <p className="text-gray-600">Can't find what you're looking for? Contact our support team.</p>
              </div>

              {/* FAQ Items */}
              <div className="space-y-3">
                {/* FAQ Item 1 */}
              <Disclosure>
                {({ open }) => (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <Disclosure.Button className="flex justify-between w-full px-6 py-4 text-left text-gray-900 hover:bg-gray-50 rounded-2xl focus:outline-none">
                        <span className="font-medium text-base">
                          {showingTranslateValue(storeCustomizationSetting?.faq?.faq_one)}
                      </span>
                      <ChevronUpIcon
                          className={`${open ? "transform rotate-180 text-purple-600" : "text-gray-500"} w-5 h-5 transition-transform`}
                      />
                    </Disclosure.Button>
                      <Disclosure.Panel className="px-6 pb-4 text-gray-600 leading-relaxed">
                        {showingTranslateValue(storeCustomizationSetting?.faq?.description_one)}
                    </Disclosure.Panel>
                    </div>
                )}
              </Disclosure>

                {/* FAQ Item 2 */}
                <Disclosure>
                {({ open }) => (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <Disclosure.Button className="flex justify-between w-full px-6 py-4 text-left text-gray-900 hover:bg-gray-50 rounded-2xl focus:outline-none">
                        <span className="font-medium text-base">
                          {showingTranslateValue(storeCustomizationSetting?.faq?.faq_two)}
                      </span>
                      <ChevronUpIcon
                          className={`${open ? "transform rotate-180 text-purple-600" : "text-gray-500"} w-5 h-5 transition-transform`}
                      />
                    </Disclosure.Button>
                      <Disclosure.Panel className="px-6 pb-4 text-gray-600 leading-relaxed">
                        {showingTranslateValue(storeCustomizationSetting?.faq?.description_two)}
                    </Disclosure.Panel>
                    </div>
                )}
              </Disclosure>

                {/* FAQ Item 3 */}
                <Disclosure>
                {({ open }) => (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <Disclosure.Button className="flex justify-between w-full px-6 py-4 text-left text-gray-900 hover:bg-gray-50 rounded-2xl focus:outline-none">
                        <span className="font-medium text-base">
                          {showingTranslateValue(storeCustomizationSetting?.faq?.faq_three)}
                      </span>
                      <ChevronUpIcon
                          className={`${open ? "transform rotate-180 text-purple-600" : "text-gray-500"} w-5 h-5 transition-transform`}
                      />
                    </Disclosure.Button>
                      <Disclosure.Panel className="px-6 pb-4 text-gray-600 leading-relaxed">
                        {showingTranslateValue(storeCustomizationSetting?.faq?.description_three)}
                    </Disclosure.Panel>
                    </div>
                )}
              </Disclosure>

                {/* FAQ Item 4 */}
                <Disclosure>
                {({ open }) => (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <Disclosure.Button className="flex justify-between w-full px-6 py-4 text-left text-gray-900 hover:bg-gray-50 rounded-2xl focus:outline-none">
                        <span className="font-medium text-base">
                          {showingTranslateValue(storeCustomizationSetting?.faq?.faq_four)}
                      </span>
                      <ChevronUpIcon
                          className={`${open ? "transform rotate-180 text-purple-600" : "text-gray-500"} w-5 h-5 transition-transform`}
                      />
                    </Disclosure.Button>
                      <Disclosure.Panel className="px-6 pb-4 text-gray-600 leading-relaxed">
                        {showingTranslateValue(storeCustomizationSetting?.faq?.description_four)}
                    </Disclosure.Panel>
                    </div>
                )}
              </Disclosure>

                {/* FAQ Item 5 */}
                <Disclosure>
                {({ open }) => (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <Disclosure.Button className="flex justify-between w-full px-6 py-4 text-left text-gray-900 hover:bg-gray-50 rounded-2xl focus:outline-none">
                        <span className="font-medium text-base">
                          {showingTranslateValue(storeCustomizationSetting?.faq?.faq_five)}
                      </span>
                      <ChevronUpIcon
                          className={`${open ? "transform rotate-180 text-purple-600" : "text-gray-500"} w-5 h-5 transition-transform`}
                      />
                    </Disclosure.Button>
                      <Disclosure.Panel className="px-6 pb-4 text-gray-600 leading-relaxed">
                        {showingTranslateValue(storeCustomizationSetting?.faq?.description_five)}
                    </Disclosure.Panel>
                    </div>
                )}
              </Disclosure>

                {/* FAQ Item 6 */}
              <Disclosure>
                {({ open }) => (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <Disclosure.Button className="flex justify-between w-full px-6 py-4 text-left text-gray-900 hover:bg-gray-50 rounded-2xl focus:outline-none">
                        <span className="font-medium text-base">
                          {showingTranslateValue(storeCustomizationSetting?.faq?.faq_six)}
                      </span>
                      <ChevronUpIcon
                          className={`${open ? "transform rotate-180 text-purple-600" : "text-gray-500"} w-5 h-5 transition-transform`}
                      />
                    </Disclosure.Button>
                      <Disclosure.Panel className="px-6 pb-4 text-gray-600 leading-relaxed">
                        {showingTranslateValue(storeCustomizationSetting?.faq?.description_six)}
                    </Disclosure.Panel>
                    </div>
                )}
              </Disclosure>

                {/* FAQ Item 7 */}
                <Disclosure>
                {({ open }) => (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <Disclosure.Button className="flex justify-between w-full px-6 py-4 text-left text-gray-900 hover:bg-gray-50 rounded-2xl focus:outline-none">
                        <span className="font-medium text-base">
                          {showingTranslateValue(storeCustomizationSetting?.faq?.faq_seven)}
                      </span>
                      <ChevronUpIcon
                          className={`${open ? "transform rotate-180 text-purple-600" : "text-gray-500"} w-5 h-5 transition-transform`}
                      />
                    </Disclosure.Button>
                      <Disclosure.Panel className="px-6 pb-4 text-gray-600 leading-relaxed">
                        {showingTranslateValue(storeCustomizationSetting?.faq?.description_seven)}
                    </Disclosure.Panel>
                    </div>
                )}
              </Disclosure>
              </div>
            </div>
          </div>

          {/* Contact Support CTA */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-8 lg:p-12 mt-16 text-center">
            <h3 className="text-2xl lg:text-3xl font-bold text-white mb-4">
              Still Need Help?
            </h3>
            <p className="text-purple-100 text-lg mb-8 max-w-2xl mx-auto">
              Our support team is here to help you with any questions or concerns you may have.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/contact-us"
                className="bg-white text-purple-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-colors inline-flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Contact Support
              </a>
              <a
                href="/chat"
                className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white hover:text-purple-600 transition-colors inline-flex items-center justify-center"
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

export default Faq;
