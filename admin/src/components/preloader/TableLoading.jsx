import React, { useContext } from "react";
import Skeleton from "react-loading-skeleton";
import { SimpleTableContainer, SimpleTableFooter } from "@/components/table/SimpleTable";

const TableLoading = ({ row = 5, col = 4, width = 290, height = 25 }) => {
  // Get the current theme mode (light/dark)
  const isDarkMode = document.documentElement.classList.contains('dark');
  const mode = isDarkMode ? 'dark' : 'light';
  
  const newArray = [];

  for (let i = 1; i <= row; i++) {
    newArray.push(i);
  }

  return (
    <SimpleTableContainer className="mb-8">
      <div className="text-center">
        <Skeleton
          height={40}
          width={width}
          count={col}
          inline={true}
          className="mx-1 my-1 dark:bg-gray-800 bg-gray-200"
          baseColor={`${mode === "dark" ? "#010101" : "#f9f9f9"}`}
          highlightColor={`${mode === "dark" ? "#1a1c23" : "#f8f8f8"} `}
        />

        {newArray.map((item) => (
          <div key={item}>
            <Skeleton
              height={height}
              width={width}
              count={col}
              inline={true}
              className="mx-1 my-1 dark:bg-gray-800 bg-gray-200"
              baseColor={`${mode === "dark" ? "#010101" : "#f9f9f9"}`}
              highlightColor={`${mode === "dark" ? "#1a1c23" : "#f8f8f8"} `}
            />
          </div>
        ))}
      </div>

      <SimpleTableFooter className="flex justify-between p-4">
        <div>
          <Skeleton
            className="dark:bg-gray-800 bg-gray-200"
            baseColor={`${mode === "dark" ? "#010101" : "#f9f9f9"}`}
            highlightColor={`${mode === "dark" ? "#1a1c23" : "#f8f8f8"} `}
            height={25}
            width={290}
            count={1}
          />
        </div>
        <div>
          <Skeleton
            className="dark:bg-gray-800 bg-gray-200"
            baseColor={`${mode === "dark" ? "#010101" : "#f9f9f9"}`}
            highlightColor={`${mode === "dark" ? "#1a1c23" : "#f8f8f8"} `}
            height={25}
            width={290}
            count={1}
          />
        </div>
      </SimpleTableFooter>
    </SimpleTableContainer>
  );
};

export default TableLoading;
