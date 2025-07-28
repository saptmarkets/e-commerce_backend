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
  const { t } = useTranslation("common");
  const { tr, lang } = useUtilsFunction();
  const userInfo = getUserSession();

  const { showingTranslateValue } = useUtilsFunction();
  const { loading, storeCustomizationSetting } = useGetSetting();

  // Fetch social_links section for footer content
  const { getSection } = useHomepageSections();
  const socialSection = getSection('social_links');
  const contact = socialSection?.content?.contact || {};

  return (
    <div className="pb-16 lg:pb-0 xl:pb-0 bg-gray-800 text-white">
      <div className="mx-auto max-w-screen-2xl px-3 sm:px-4 md:px-6 lg:px-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 xl:grid-cols-12 gap-3 sm:gap-4 md:gap-5 lg:gap-9 xl:gap-7 py-6 sm:py-8 md:py-10 lg:py-16 justify-between">
          <div className="pb-2 sm:pb-3 md:pb-3.5 col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-3">
            <Link href="/" className="mr-3 lg:mr-12 xl:mr-12" rel="noreferrer">
              <div className="relative w-16 h-10 sm:w-18 sm:h-11 md:w-20 md:h-12 mb-1 sm:mb-2">
                <Image
                  width="0"
                  height="0"
                  sizes="100vw"
                  className="w-full h-auto"
                  style={{ width: 'auto', height: 'auto' }}
                  src="/logo/logo-light.svg"
                  alt="SAPT Markets"
                />
              </div>
            </Link>
            <p className="leading-5 sm:leading-6 md:leading-7 font-sans text-xs sm:text-sm mt-2 sm:mt-3 md:mt-4">
              {tr('Your go-to supermarket in Qassim for fresh deals every day.','متجرك المفضل في القصيم لصفقات طازجة كل يوم.')}
            </p>
            <div className="mt-3 sm:mt-4 md:mt-6">
              <SocialLinks />
            </div>
          </div>

          <div className="pb-2 sm:pb-3 md:pb-3.5 col-span-1 md:col-span-1 lg:col-span-2">
            <h3 className="text-sm sm:text-md lg:leading-7 font-medium mb-2 sm:mb-3 md:mb-4 lg:mb-6 pb-0.5">
              <CMSkeleton
                count={1}
                height={20}
                loading={loading}
                data={lang === 'ar' ? 'الشركة' : 'Company'}
              />
            </h3>
            <ul className="text-xs sm:text-sm flex flex-col space-y-1.5 sm:space-y-2 md:space-y-3">
              <li className="flex items-baseline">
                <Link
                  href="/about-us"
                  className="text-gray-300 inline-block w-full hover:text-primary transition duration-200"
                >
                  {tr('About Us','من نحن')}
                </Link>
              </li>
              <li className="flex items-baseline">
                <Link
                  href="/contact-us"
                  className="text-gray-300 inline-block w-full hover:text-primary transition duration-200"
                >
                  {tr('Contact Us','تواصل معنا')}
                </Link>
              </li>
              <li className="flex items-baseline">
                <Link
                  href="/careers"
                  className="text-gray-300 inline-block w-full hover:text-primary transition duration-200"
                >
                  {tr('Careers','الوظائف')}
                </Link>
              </li>
              <li className="flex items-baseline">
                <Link
                  href="/blog"
                  className="text-gray-300 inline-block w-full hover:text-primary transition duration-200"
                >
                  {tr('Blog','المدونة')}
                </Link>
              </li>
            </ul>
          </div>

          <div className="pb-2 sm:pb-3 md:pb-3.5 col-span-1 md:col-span-1 lg:col-span-2">
            <h3 className="text-sm sm:text-md lg:leading-7 font-medium mb-2 sm:mb-3 md:mb-4 lg:mb-6 pb-0.5">
              <CMSkeleton
                count={1}
                height={20}
                loading={loading}
                data={lang === 'ar' ? 'خدمة العملاء' : 'Customer Service'}
              />
            </h3>
            <ul className="text-xs sm:text-sm lg:text-15px flex flex-col space-y-1.5 sm:space-y-2 md:space-y-3">
              <li className="flex items-baseline">
                <Link
                  href="/help"
                  className="text-gray-300 inline-block w-full hover:text-primary transition duration-200"
                >
                  {tr('Help Center','مركز المساعدة')}
                </Link>
              </li>
              <li className="flex items-baseline">
                <Link
                  href="/faq"
                  className="text-gray-300 inline-block w-full hover:text-primary transition duration-200"
                >
                  {tr('FAQ','الأسئلة الشائعة')}
                </Link>
              </li>
              <li className="flex items-baseline">
                <Link
                  href="/terms-and-conditions"
                  className="text-gray-300 inline-block w-full hover:text-primary transition duration-200"
                >
                  {tr('Terms & Conditions','الشروط والأحكام')}
                </Link>
              </li>
              <li className="flex items-baseline">
                <Link
                  href="/privacy-policy"
                  className="text-gray-300 inline-block w-full hover:text-primary transition duration-200"
                >
                  {tr('Privacy Policy','سياسة الخصوصية')}
                </Link>
              </li>
            </ul>
          </div>

          <div className="pb-2 sm:pb-3 md:pb-3.5 col-span-1 md:col-span-1 lg:col-span-2">
            <h3 className="text-sm sm:text-md lg:leading-7 font-medium mb-2 sm:mb-3 md:mb-4 lg:mb-6 pb-0.5">
              <CMSkeleton
                count={1}
                height={20}
                loading={loading}
                data={lang === 'ar' ? 'روابط سريعة' : 'Quick Links'}
              />
            </h3>
            <ul className="text-xs sm:text-sm lg:text-15px flex flex-col space-y-1.5 sm:space-y-2 md:space-y-3">
              <li className="flex items-baseline">
                <Link
                  href="/user/dashboard"
                  className="text-gray-300 inline-block w-full hover:text-primary transition duration-200"
                >
                  {tr('My Account','حسابي')}
                </Link>
              </li>
              <li className="flex items-baseline">
                <Link
                  href="/order/order-history"
                  className="text-gray-300 inline-block w-full hover:text-primary transition duration-200"
                >
                  {tr('Order History','تاريخ الطلبات')}
                </Link>
              </li>
              <li className="flex items-baseline">
                <Link
                  href="/user/my-wishlist"
                  className="text-gray-300 inline-block w-full hover:text-primary transition duration-200"
                >
                  {tr('Wishlist','قائمة الأمنيات')}
                </Link>
              </li>
              <li className="flex items-baseline">
                <Link
                  href="/checkout"
                  className="text-gray-300 inline-block w-full hover:text-primary transition duration-200"
                >
                  {tr('Checkout','الدفع')}
                </Link>
              </li>
            </ul>
          </div>

          <div className="pb-2 sm:pb-3 md:pb-3.5 col-span-1 sm:col-span-2 md:col-span-2 lg:col-span-3">
            <h3 className="text-sm sm:text-md lg:leading-7 font-medium mb-2 sm:mb-3 md:mb-4 lg:mb-6 pb-0.5">
              {tr('Store Information','معلومات المتجر')}
            </h3>
            <ul className="text-xs sm:text-sm lg:text-15px flex flex-col space-y-1.5 sm:space-y-2 md:space-y-3 text-gray-300">
              {contact.address?.en && <li>{tr('Address','العنوان')}: {contact.address.en}</li>}
              {contact.phone && <li>{tr('Phone','الهاتف')}: {contact.phone}</li>}
              {contact.email && <li>{tr('Email','البريد الإلكتروني')}: {contact.email}</li>}
              {contact.hours && <li>{tr('Hours','ساعات العمل')}: {contact.hours}</li>}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-700 w-full">
        <div className="mx-auto max-w-screen-2xl px-3 sm:px-4 md:px-6 lg:px-10 flex justify-center py-2 sm:py-3 md:py-4">
          <p className="text-xs sm:text-sm text-gray-400 leading-4 sm:leading-5 md:leading-6">
            © 2024 <span className="brand-name-arabic">SAPT Markets</span>. {t('allRightsReserved')}.
          </p>
        </div>
      </div>
    </div>
  );
};

export default dynamic(() => Promise.resolve(Footer), { ssr: false });
