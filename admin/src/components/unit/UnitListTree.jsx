import React, { useState, useEffect, useContext } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHeader,
  TableRow,
  Button,
  Badge,
  Avatar,
  Card,
  CardBody,
  Input
} from '@windmill/react-ui';
import {
  FiChevronDown,
  FiChevronRight,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiEye,
  FiEyeOff,
  FiGrid,
  FiPackage,
  FiLayers
} from 'react-icons/fi';

//internal import
import UnitServices from '@/services/UnitServices';
import { notifyError, notifySuccess } from '@/utils/toast';
import useToggleDrawer from '@/hooks/useToggleDrawer';
import { SidebarContext } from '@/context/SidebarContext';
import DeleteModal from '@/components/modal/DeleteModal';
import MainDrawer from '@/components/drawer/MainDrawer';
import UnitDrawer from '@/components/drawer/UnitDrawer';
import CheckBox from '@/components/form/input/CheckBox';
import useFilter from '@/hooks/useFilter';

const UnitListTree = () => {
  const { isDrawerOpen, serviceId, handleModalOpen, handleUpdate } = useToggleDrawer();
  const { lang } = useContext(SidebarContext);
  const [units, setUnits] = useState([]);
  const [parentUnits, setParentUnits] = useState([]);
  const [expandedUnits, setExpandedUnits] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [allSelectId, setAllSelectId] = useState([]);
  const [isCheckAll, setIsCheckAll] = useState(false);
  const [isCheck, setIsCheck] = useState([]);

  const {
    handleChangePage,
    totalResults,
    resultsPerPage,
    dataTable,
    serviceData,
    page,
    handleSubmitForAll,
    searchRef,
    searchText,
    handleOnChange
  } = useFilter(units);

  useEffect(() => {
    fetchUnits();
  }, []);

  const fetchUnits = async () => {
    try {
      setLoading(true);
      const res = await UnitServices.getAllUnits();
      const unitsData = res.data || res;
      
      // Separate parent and child units
      const parents = unitsData.filter(unit => unit.isParent);
      const children = unitsData.filter(unit => !unit.isParent);
      
      // Group children by their parent
      const parentMap = {};
      parents.forEach(parent => {
        parentMap[parent._id] = {
          ...parent,
          children: children.filter(child => 
            child.parentUnit && child.parentUnit._id === parent._id
          )
        };
      });
      
      setUnits(unitsData);
      setParentUnits(Object.values(parentMap));
      setAllSelectId(unitsData.map(unit => unit._id));
    } catch (error) {
      notifyError(error.message || 'Failed to fetch units');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleExpand = (unitId) => {
    const newExpanded = new Set(expandedUnits);
    if (newExpanded.has(unitId)) {
      newExpanded.delete(unitId);
    } else {
      newExpanded.add(unitId);
    }
    setExpandedUnits(newExpanded);
  };

  const handleToggleStatus = async (unitId, currentStatus) => {
    try {
      await UnitServices.updateStatus(unitId, !currentStatus);
      fetchUnits();
      notifySuccess(`Unit ${!currentStatus ? 'enabled' : 'disabled'} successfully!`);
    } catch (error) {
      notifyError(error.message || 'Failed to update unit status');
    }
  };

  const handleDeleteUnit = async (unitId) => {
    try {
      await UnitServices.deleteUnit(unitId);
      fetchUnits();
      notifySuccess('Unit deleted successfully!');
    } catch (error) {
      notifyError(error.message || 'Failed to delete unit');
    }
  };

  const handleSelectAll = () => {
    setIsCheckAll(!isCheckAll);
    setIsCheck(allSelectId.map((li) => li));
    if (isCheckAll) {
      setIsCheck([]);
    }
  };

  const handleClick = (e) => {
    const { id, checked } = e.target;
    setIsCheck([...isCheck, id]);
    if (!checked) {
      setIsCheck(isCheck.filter((item) => item !== id));
    }
  };

  const renderUnitRow = (unit, isChild = false, level = 0) => {
    const hasChildren = unit.children && unit.children.length > 0;
    const isExpanded = expandedUnits.has(unit._id);
    const indentStyle = { paddingLeft: `${level * 20 + 16}px` };

    return (
      <React.Fragment key={unit._id}>
        <TableRow className={`hover:bg-gray-50 ${isChild ? 'bg-gray-25' : ''}`}>
          <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
            {!isChild && (
              <CheckBox
                type="checkbox"
                name={unit._id}
                id={unit._id}
                handleClick={handleClick}
                isChecked={isCheck?.includes(unit._id)}
              />
            )}
          </TableCell>
          
          <TableCell style={indentStyle} className="px-6 py-4 whitespace-nowrap">
            <div className="flex items-center">
              {hasChildren && (
                <button
                  className="mr-2 p-1 text-gray-600 hover:text-gray-800"
                  onClick={() => handleToggleExpand(unit._id)}
                >
                  {isExpanded ? <FiChevronDown className="w-4 h-4" /> : <FiChevronRight className="w-4 h-4" />}
                </button>
              )}
              
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isChild ? 'bg-blue-100' : 'bg-green-100'
                }`}>
                  {isChild ? 
                    <FiPackage className="w-4 h-4 text-blue-600" /> : 
                    <FiGrid className="w-4 h-4 text-green-600" />
                  }
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {unit.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {unit.shortCode}
                  </p>
                </div>
              </div>
            </div>
          </TableCell>

          <TableCell className="px-6 py-4 whitespace-nowrap">
            <div className="flex space-x-1">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                unit.isParent 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {unit.isParent ? 'Parent' : 'Child'}
              </span>
              {unit.type && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {unit.type}
                </span>
              )}
            </div>
          </TableCell>

          <TableCell className="px-6 py-4 whitespace-nowrap text-center">
            {!unit.isParent && unit.packValue && (
              <span className="text-sm font-medium text-gray-900">
                {unit.packValue}
              </span>
            )}
          </TableCell>

          <TableCell className="px-6 py-4 whitespace-nowrap text-center">
            <Badge 
              type={unit.status ? 'success' : 'danger'}
            >
              {unit.status ? 'Active' : 'Inactive'}
            </Badge>
          </TableCell>

          <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <div className="flex justify-end space-x-2">
              <button
                className={`p-1 rounded hover:bg-gray-100 ${
                  unit.status ? 'text-green-600' : 'text-gray-400'
                }`}
                onClick={() => handleToggleStatus(unit._id, unit.status)}
                title={unit.status ? 'Hide Unit' : 'Show Unit'}
              >
                {unit.status ? <FiEye className="w-4 h-4" /> : <FiEyeOff className="w-4 h-4" />}
              </button>

              <button
                className="p-1 rounded hover:bg-gray-100 text-blue-600 hover:text-blue-800"
                onClick={() => handleUpdate(unit._id)}
                title="Edit Unit"
              >
                <FiEdit className="w-4 h-4" />
              </button>

              <button
                className="p-1 rounded hover:bg-gray-100 text-red-600 hover:text-red-800"
                onClick={() => handleModalOpen(unit._id)}
                title={t("DeleteUnit")}
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            </div>
          </TableCell>
        </TableRow>

        {/* Render children */}
        {hasChildren && isExpanded && (
          unit.children.map(child => 
            renderUnitRow(child, true, level + 1)
          )
        )}
      </React.Fragment>
    );
  };

  return (
    <>
      <Card className="min-w-0 rounded-lg overflow-hidden bg-white dark:bg-gray-800 mb-5">
        <CardBody>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-300">
                Hierarchical Unit Management
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Manage parent units and their child unit configurations
              </p>
            </div>
            
            <div className="flex space-x-3">
              <Button
                layout="outline"
                size="small"
                onClick={() => {
                  // Expand all parent units
                  const allParentIds = parentUnits.map(unit => unit._id);
                  setExpandedUnits(new Set(allParentIds));
                }}
              >
                <FiLayers className="w-4 h-4 mr-2" />
                Expand All
              </Button>
              
              <Button
                size="small"
                onClick={() => handleUpdate()}
              >
                <FiPlus className="w-4 h-4 mr-2" />
                Add Unit
              </Button>
            </div>
          </div>

          <TableContainer className="mb-8">
            <Table>
              <TableHeader>
                <tr>
                  <TableCell>
                    <CheckBox
                      type="checkbox"
                      name="selectAll"
                      id="selectAll"
                      handleClick={handleSelectAll}
                      isChecked={isCheckAll}
                    />
                  </TableCell>
                  <TableCell>Unit Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell className="text-center">Pack Value</TableCell>
                  <TableCell className="text-center">Status</TableCell>
                  <TableCell className="text-right">Actions</TableCell>
                </tr>
              </TableHeader>
              
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                      <p className="mt-2 text-gray-500">Loading units...</p>
                    </TableCell>
                  </TableRow>
                ) : parentUnits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="text-gray-500">
                        <FiLayers className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No units found. Create your first unit to get started.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  parentUnits.map(parentUnit => renderUnitRow(parentUnit))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardBody>
      </Card>

      {/* Drawers and Modals */}
      <MainDrawer>
        <UnitDrawer id={serviceId} />
      </MainDrawer>

      <DeleteModal
        id={serviceId}
        title={t("DeleteUnit")}
        isCheck={isCheck}
        setIsCheck={setIsCheck}
        handleDeleteMany={handleSubmitForAll}
        handleDelete={handleDeleteUnit}
      />
    </>
  );
};

export default UnitListTree; 