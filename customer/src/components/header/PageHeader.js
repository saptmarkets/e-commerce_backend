import React from "react";
import { useQuery } from "@tanstack/react-query";
import BannerServices from "@services/BannerServices";
import useTranslation from "next-translate/useTranslation";

const PageHeader = ({ title, headerBg }) => {
  const { t } = useTranslation();
  // Fetch page header banners from API
  const { data: banners } = useQuery({
    queryKey: ["page-header-banners"],
    queryFn: () => BannerServices.getBannersByLocation("page-header"),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Use API banner if available, otherwise use prop or default
  const banner = banners?.banners?.[0];
  const backgroundImage = banner?.imageUrl || headerBg || "/images/banner/page-header.jpg";

  return (
    <div
      style={{ backgroundImage: `url(${backgroundImage})` }}
      className={`flex justify-center py-10 lg:py-20 bg-gray-50 w-full bg-cover bg-no-repeat bg-bottom`}
    >
      <div className="flex mx-auto w-full max-w-screen-2xl px-3 sm:px-10">
        <div className="w-full flex justify-center flex-col relative">
          <h2 className="text-xl md:text-3xl lg:text-4xl font-bold font-serif text-center text-gray-700">
            {t(`common:${title}`)}
          </h2>
        </div>
      </div>
    </div>
  );
};

export default PageHeader;
