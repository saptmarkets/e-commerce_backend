import React from 'react';
import { Button, Input, Select } from '@windmill/react-ui';
import { useTranslation } from 'react-i18next';
import { Controller } from 'react-hook-form';
import { Scrollbars } from 'react-custom-scrollbars-2';
import RcDrawer from 'rc-drawer';

import LabelArea from '@/components/form/selectOption/LabelArea';
import Error from '@/components/form/others/Error';
import DrawerButton from '@/components/form/button/DrawerButton';
import Title from '@/components/form/others/Title';

const UnitDrawer = ({
  id,
  isOpen,
  onClose,
  title,
  handleSubmit,
  isLoading,
  register,
  errors,
  control,
}) => {
  const { t } = useTranslation();

  return (
    <RcDrawer
      open={isOpen}
      onClose={onClose}
      parent={null}
      level={null}
      placement="right"
    >
      <div className="flex flex-col w-full h-full justify-between">
        <div className="w-full relative p-6 border-b border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
          <Title
            title={id ? t('Update Unit') : t('Add Unit')}
            description={t('Unit management')}
          />
        </div>
        <Scrollbars className="w-full md:w-7/12 lg:w-8/12 xl:w-8/12 relative">
          <form onSubmit={handleSubmit} className="block">
            <div className="px-6 pt-8 flex-grow w-full">
              <div className="grid grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                <LabelArea label={t('Unit Name')} />
                <div className="col-span-8 sm:col-span-4">
                  <Input
                    {...register('name', { required: 'Unit name is required' })}
                    className="border h-12 text-sm focus:outline-none block w-full bg-gray-100 dark:bg-gray-700 border-transparent focus:bg-white"
                    type="text"
                    placeholder={t('Enter unit name...')}
                  />
                  <Error errorName={errors.name} />
                </div>
              </div>
              
              {/* Arabic Name Field - New! */}
              <div className="grid grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                <LabelArea label={t('Unit Name (Arabic)')} />
                <div className="col-span-8 sm:col-span-4">
                  <Input
                    {...register('nameAr')}
                    className="border h-12 text-sm focus:outline-none block w-full bg-gray-100 dark:bg-gray-700 border-transparent focus:bg-white"
                    type="text"
                    placeholder={t('Enter Arabic unit name...')}
                    dir="rtl"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {t('Optional - Leave empty if importing from Odoo')}
                  </p>
                  <Error errorName={errors.nameAr} />
                </div>
              </div>
              
              <div className="grid grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                <LabelArea label={t('Short Code')} />
                <div className="col-span-8 sm:col-span-4">
                  <Input
                    {...register('shortCode', { required: 'Short code is required' })}
                    className="border h-12 text-sm focus:outline-none block w-full bg-gray-100 dark:bg-gray-700 border-transparent focus:bg-white"
                    type="text"
                    placeholder={t('Enter short code...')}
                  />
                  <Error errorName={errors.shortCode} />
                </div>
              </div>

              <div className="grid grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                <LabelArea label={t('Unit Type')} />
                <div className="col-span-8 sm:col-span-4">
                  <Controller
                    name="type"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        className="border h-12 text-sm focus:outline-none block w-full bg-gray-100 dark:bg-gray-700 border-transparent focus:bg-white"
                      >
                        <option value="pack">{t('Pack')}</option>
                        <option value="weight">{t('Weight')}</option>
                        <option value="volume">{t('Volume')}</option>
                      </Select>
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                <LabelArea label={t('Is this a base unit?')} />
                <div className="col-span-8 sm:col-span-4">
                  <Controller
                    name="isBase"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    )}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                <LabelArea label={t('Status')} />
                <div className="col-span-8 sm:col-span-4">
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        className="border h-12 text-sm focus:outline-none block w-full bg-gray-100 dark:bg-gray-700 border-transparent focus:bg-white"
                      >
                        <option value="show">{t('Show')}</option>
                        <option value="hide">{t('Hide')}</option>
                      </Select>
                    )}
                  />
                </div>
              </div>
            </div>
            <DrawerButton id={id} title="Unit" isSubmitting={isLoading} />
          </form>
        </Scrollbars>
      </div>
    </RcDrawer>
  );
};

export default UnitDrawer; 