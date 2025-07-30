import React, { useMemo } from "react";
import {
  ShieldCheckIcon,
  DocumentSearchIcon,
  FingerPrintIcon,
  LockClosedIcon,
  DatabaseIcon,
  RefreshIcon,
  GlobeAltIcon,
  BellIcon,
} from "@heroicons/react/solid";

import Layout from "@layout/Layout";
import useGetSetting from "@hooks/useGetSetting";
import CMSkeleton from "@components/preloader/CMSkeleton";
import useUtilsFunction from "@hooks/useUtilsFunction";

const SectionBox = ({ children, className = "" }) => (
  <div className={`bg-white rounded-2xl shadow p-6 md:p-8 ${className}`}>{children}</div>
);

const icons = [
  ShieldCheckIcon,
  DocumentSearchIcon,
  FingerPrintIcon,
  LockClosedIcon,
  DatabaseIcon,
  RefreshIcon,
  GlobeAltIcon,
  BellIcon,
];

const tints = [
  "blue",
  "indigo",
  "emerald",
  "amber",
  "purple",
  "rose",
  "teal",
  "orange",
];

const words = [
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
];

const PrivacyPolicy = () => {
  const { storeCustomizationSetting } = useGetSetting();
  const { showingTranslateValue } = useUtilsFunction();

  const pp = storeCustomizationSetting?.privacy_policy || {};

  const sections = useMemo(() => {
    return words
      .map((w, i) => {
        const title = showingTranslateValue(pp[`section_${w}_title`]);
        const body = showingTranslateValue(pp[`section_${w}_body`]);
        return title ? { title, body, idx: i } : null;
      })
      .filter(Boolean);
  }, [pp, showingTranslateValue]);

  const rights = useMemo(() => {
    const labels = [
      "one",
      "two",
      "three",
      "four",
      "five",
      "six",
    ];
    return labels
      .map((w) => {
        const name = showingTranslateValue(pp[`right_${w}_name`]);
        const desc = showingTranslateValue(pp[`right_${w}_desc`]);
        const emoji = showingTranslateValue(pp[`right_${w}_emoji`]);
        return name ? { name, desc, emoji } : null;
      })
      .filter(Boolean);
  }, [pp, showingTranslateValue]);

  const brandColor =
    storeCustomizationSetting?.brand_color ||
    storeCustomizationSetting?.settings?.brand_color ||
    "#059669";

  return (
    <Layout title="Privacy Policy" description="SAPT Markets data protection policy">
      {/* hero */}
      {(() => {
        const hasBg = pp.header_bg;
        const bgStyle = hasBg
          ? {
              backgroundImage: `url(${pp.header_bg})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : {};
        const bgClasses = hasBg
          ? ""
          : "bg-gradient-to-br from-sky-50 to-indigo-100";
        return (
          <div
            className={`${bgClasses} relative py-20 text-center px-4`}
            style={bgStyle}
          >
            {hasBg && (
              <div className="absolute inset-0 bg-white/60 backdrop-brightness-95"></div>
            )}
            <div className="relative">
              <h1 className="text-4xl md:text-6xl font-bold text-indigo-900 mb-4">
                {showingTranslateValue(pp.title) || "Privacy Policy"}
              </h1>
              <p className="text-lg text-gray-700 max-w-2xl mx-auto">
                {showingTranslateValue(pp.subtitle) ||
                  "SAPT Markets – Data Protection & Privacy"}
              </p>
            </div>
          </div>
        );
      })()}

      <div className="bg-[#F5F1FA] w-full px-4 pb-20 pt-12">
        <SectionBox className="max-w-screen-2xl mx-auto">
          {/* ribbons */}
          <div className="grid md:grid-cols-3 gap-4 mb-6 text-sm font-medium">
            <div className="col-span-1 flex items-center space-x-2 px-4 py-2 rounded-md text-indigo-900" style={{ background: brandColor + "1A" }}>
              <span className="font-semibold">Effective Date:</span>
              <span>{showingTranslateValue(pp.effective_date) || "—"}</span>
            </div>
            <div className="col-span-1 md:col-span-1 flex items-center justify-center px-4 py-2 rounded-md text-indigo-900 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
              {showingTranslateValue(pp.tagline) || "Your privacy is our priority. Learn how we protect and handle your data."}
            </div>
            <div className="col-span-1 flex items-center space-x-2 px-4 py-2 rounded-md text-indigo-900 md:justify-end" style={{ background: brandColor + "1A" }}>
              <span className="font-semibold">Last Updated:</span>
              <span>{showingTranslateValue(pp.last_updated) || "—"}</span>
            </div>
          </div>

          {/* sections grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {sections.map(({ title, body, idx }) => {
              const Icon = icons[idx % icons.length];
              const tint = tints[idx % tints.length];
              return (
                <div key={idx} className="flex items-start space-x-4 bg-gradient-to-br from-white to-gray-50 border border-gray-100 p-6 rounded-2xl shadow-sm">
                  <div className={`w-12 h-12 bg-${tint}-100 rounded-xl flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 text-${tint}-600`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-indigo-800 mb-1">{title}</h3>
                    <p className="text-gray-600 text-sm whitespace-pre-line">{body}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* rights badge section */}
          {rights.length > 0 && (
            <div className="bg-gradient-to-br from-sky-50 to-indigo-50 border border-indigo-100 rounded-2xl p-8 mt-12">
              <h3 className="text-xl md:text-2xl font-bold text-indigo-800 text-center mb-6">
                {showingTranslateValue(pp.rights_title) || "Your Data Rights"}
              </h3>
              <p className="text-center text-gray-600 mb-8 max-w-xl mx-auto">
                {showingTranslateValue(pp.rights_desc) || "Under Saudi PDPL, you have comprehensive rights over your personal data"}
              </p>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {rights.map((r, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center py-6 text-center shadow-sm">
                    <span className="text-3xl mb-2">{r.emoji || "🛡️"}</span>
                    <h4 className="font-semibold text-indigo-800">{r.name}</h4>
                    <p className="text-gray-500 text-xs mt-1 max-w-[200px]">{r.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* rich desc */}
          {showingTranslateValue(pp.description) && (
            <div className="prose max-w-none mt-12" dangerouslySetInnerHTML={{ __html: showingTranslateValue(pp.description) }} />
          )}
        </SectionBox>

        {/* CTA */}
        {(showingTranslateValue(pp.cta_title) || showingTranslateValue(pp.cta_desc)) && (
          <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 rounded-3xl p-10 md:p-14 mt-16 text-center max-w-screen-2xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
              {showingTranslateValue(pp.cta_title) || "Questions About Your Privacy?"}
            </h3>
            <p className="text-gray-200 text-lg mb-8 max-w-2xl mx-auto">
              {showingTranslateValue(pp.cta_desc) || "Our privacy team is here to help you understand and exercise your data rights."}
            </p>
            {showingTranslateValue(pp.cta_btn_text) && (
              <a
                href={showingTranslateValue(pp.cta_btn_link) || "#"}
                className="inline-block bg-white text-indigo-800 font-semibold px-10 py-4 rounded-xl shadow hover:shadow-lg transition"
              >
                {showingTranslateValue(pp.cta_btn_text)}
              </a>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PrivacyPolicy;
