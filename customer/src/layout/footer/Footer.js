import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import useTranslation from "next-translate/useTranslation";
import SocialLinks from "@components/common/SocialLinks";
import useHomepageSections from "@hooks/useHomepageSections";

//internal import
import { getUserSession } from "@lib/auth";
import useGetSetting from "@hooks/useGetSetting";
import CMSkeleton from "@components/preloader/CMSkeleton";
import useUtilsFunction from "@hooks/useUtilsFunction";

const Footer = () => {
  const { t } = useTranslation();
  const userInfo = getUserSession();

  const { showingTranslateValue } = useUtilsFunction();
  const { loading, storeCustomizationSetting } = useGetSetting();

  // Fetch social_links section for footer content
  const { getSection } = useHomepageSections();
  const socialSection = getSection('social_links');
  const contact = socialSection?.content?.contact || {};

  return (
    <div className="pb-16 lg:pb-0 xl:pb-0 bg-gray-800 text-white">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-10">
        <div className="grid grid-cols-2 md:grid-cols-7 xl:grid-cols-12 gap-5 sm:gap-9 lg:gap-11 xl:gap-7 py-10 lg:py-16 justify-between">
          <div className="pb-3.5 sm:pb-0 col-span-2 md:col-span-3 lg:col-span-3">
            <Link href="/" className="mr-3 lg:mr-12 xl:mr-12" rel="noreferrer">
              <div className="relative w-20 h-6">
                <Image
                  width="0"
                  height="0"
                  sizes="100vw"
                  className="w-full h-auto"
                  src="/logo/logo-light.svg"
                  alt="SAPT Markets"
                />
              </div>
            </Link>
            <p className="leading-7 font-sans text-sm mt-6">
              {t('companyDescription')}
            </p>
            <div className="mt-6">
              <SocialLinks />
            </div>
          </div>

          <div className="pb-3.5 sm:pb-0 col-span-1 md:col-span-1 lg:col-span-2">
            <h3 className="text-md lg:leading-7 font-medium mb-4 sm:mb-5 lg:mb-6 pb-0.5">
              <CMSkeleton
                count={1}
                height={20}
                loading={loading}
                data={storeCustomizationSetting?.footer?.block1_title || "Company"}
              />
            </h3>
            <ul className="text-sm flex flex-col space-y-3">
              <li className="flex items-baseline">
                <Link
                  href="/about-us"
                  className="text-gray-300 inline-block w-full hover:text-primary transition duration-200"
                >
                  {t('aboutUs')}
                </Link>
              </li>
              <li className="flex items-baseline">
                <Link
                  href="/contact-us"
                  className="text-gray-300 inline-block w-full hover:text-primary transition duration-200"
                >
                  {t('contactUs')}
                </Link>
              </li>
              <li className="flex items-baseline">
                <Link
                  href="/careers"
                  className="text-gray-300 inline-block w-full hover:text-primary transition duration-200"
                >
                  {t('careers')}
                </Link>
              </li>
              <li className="flex items-baseline">
                <Link
                  href="/blog"
                  className="text-gray-300 inline-block w-full hover:text-primary transition duration-200"
                >
                  {t('blog')}
                </Link>
              </li>
            </ul>
          </div>

          <div className="pb-3.5 sm:pb-0 col-span-1 md:col-span-1 lg:col-span-2">
            <h3 className="text-md lg:leading-7 font-medium mb-4 sm:mb-5 lg:mb-6 pb-0.5">
              <CMSkeleton
                count={1}
                height={20}
                loading={loading}
                data={storeCustomizationSetting?.footer?.block2_title || "Customer Service"}
              />
            </h3>
            <ul className="text-sm lg:text-15px flex flex-col space-y-3">
              <li className="flex items-baseline">
                <Link
                  href="/help"
                  className="text-gray-300 inline-block w-full hover:text-primary transition duration-200"
                >
                  {t('helpCenter')}
                </Link>
              </li>
              <li className="flex items-baseline">
                <Link
                  href="/faq"
                  className="text-gray-300 inline-block w-full hover:text-primary transition duration-200"
                >
                  {t('faq')}
                </Link>
              </li>
              <li className="flex items-baseline">
                <Link
                  href="/terms-and-conditions"
                  className="text-gray-300 inline-block w-full hover:text-primary transition duration-200"
                >
                  {t('termsAndConditions')}
                </Link>
              </li>
              <li className="flex items-baseline">
                <Link
                  href="/privacy-policy"
                  className="text-gray-300 inline-block w-full hover:text-primary transition duration-200"
                >
                  {t('privacyPolicy')}
                </Link>
              </li>
            </ul>
          </div>

          <div className="pb-3.5 sm:pb-0 col-span-1 md:col-span-1 lg:col-span-2">
            <h3 className="text-md lg:leading-7 font-medium mb-4 sm:mb-5 lg:mb-6 pb-0.5">
              <CMSkeleton
                count={1}
                height={20}
                loading={loading}
                data={storeCustomizationSetting?.footer?.block3_title || "Quick Links"}
              />
            </h3>
            <ul className="text-sm lg:text-15px flex flex-col space-y-3">
              <li className="flex items-baseline">
                <Link
                  href="/user/dashboard"
                  className="text-gray-300 inline-block w-full hover:text-primary transition duration-200"
                >
                  {t('myAccount')}
                </Link>
              </li>
              <li className="flex items-baseline">
                <Link
                  href="/order/order-history"
                  className="text-gray-300 inline-block w-full hover:text-primary transition duration-200"
                >
                  {t('orderHistory')}
                </Link>
              </li>
              <li className="flex items-baseline">
                <Link
                  href="/user/my-wishlist"
                  className="text-gray-300 inline-block w-full hover:text-primary transition duration-200"
                >
                  {t('wishlist')}
                </Link>
              </li>
              <li className="flex items-baseline">
                <Link
                  href="/checkout"
                  className="text-gray-300 inline-block w-full hover:text-primary transition duration-200"
                >
                  {t('checkout')}
                </Link>
              </li>
            </ul>
          </div>

          <div className="pb-3.5 sm:pb-0 col-span-2 md:col-span-2 lg:col-span-3">
            <h3 className="text-md lg:leading-7 font-medium mb-4 sm:mb-5 lg:mb-6 pb-0.5">
              {t('storeInformation')}
            </h3>
            <ul className="text-sm lg:text-15px flex flex-col space-y-3 text-gray-300">
              {contact.address?.en && <li>{t('address')}: {contact.address.en}</li>}
              {contact.phone && <li>{t('phone')}: {contact.phone}</li>}
              {contact.email && <li>{t('email')}: {contact.email}</li>}
              {contact.hours && <li>{t('hours')}: {contact.hours}</li>}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-700 w-full">
        <div className="mx-auto max-w-screen-2xl px-3 sm:px-10 flex justify-center py-4">
          <p className="text-sm text-gray-400 leading-6">
            © 2024 SAPT Markets. {t('allRightsReserved')}.
          </p>
        </div>
      </div>
    </div>
  );
};

export default dynamic(() => Promise.resolve(Footer), { ssr: false });
