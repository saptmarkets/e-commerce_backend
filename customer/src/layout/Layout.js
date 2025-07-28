import Head from "next/head";
import { ToastContainer } from "react-toastify";

//internal import
import Navbar from "@layout/navbar/Navbar";
import Footer from "@layout/footer/Footer";
import NavBarTop from "./navbar/NavBarTop";
import MobileFooter from "@layout/footer/MobileFooter";
import FooterBanner from "@components/banner/FooterBanner";

const Layout = ({ title, description, children }) => {
  return (
    <>
      <ToastContainer />

      <div className="font-sans">
        <Head>
          <title>
            {title
              ? `SAPT Markets | ${title}`
              : "SAPT Markets - supermarket"}
          </title>
          {description && <meta name="description" content={description} />}
          <link rel="icon" href="/favicon.png" />
        </Head>
        <NavBarTop />
        <Navbar />
        <div className="bg-white main-content-mobile">{children}</div>
        <div className="max-w-screen-2xl mx-auto responsive-padding">
          <FooterBanner />
        </div>
        <MobileFooter />
        <Footer />
      </div>
    </>
  );
};

export default Layout;
