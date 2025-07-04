import React, { useContext } from 'react';
import { FiX } from 'react-icons/fi';
import { SidebarContext } from '@/context/SidebarContext';
import Drawer from 'rc-drawer';

const TestDrawer = () => {
  const { isDrawerOpen, closeDrawer } = useContext(SidebarContext);

  return (
    <Drawer
      width="550px"
      placement="right"
      level={null}
      handler={false}
      open={isDrawerOpen}
      onClose={closeDrawer}
      maskClosable={true}
    >
      <div className="flex flex-col w-full h-full justify-between">
        <div className="w-full relative p-6 border-b border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
          <div className="flex md:flex-row flex-col justify-between items-center">
            <div>
              <h4 className="text-xl font-medium">Test Drawer</h4>
            </div>
            <button
              onClick={closeDrawer}
              className="w-10 h-10 rounded-full flex justify-center items-center hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>
        </div>
        <div className="p-6 flex-grow bg-white dark:bg-gray-700 dark:text-gray-200">
          <p>This is a test drawer content</p>
          <p>If you can see this text, the drawer is working correctly.</p>
        </div>
      </div>
    </Drawer>
  );
};

export default TestDrawer; 