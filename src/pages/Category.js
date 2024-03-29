import plusFill from '@iconify/icons-eva/plus-fill';
import { filter } from 'lodash';
import { useContext, useEffect, useState } from 'react';
// material
import {
  Card,
  Table,
  Stack,
  Avatar,
  TableRow,
  TableBody,
  TableCell,
  Container,
  Typography,
  TableContainer,
  TablePagination,
  Skeleton,
  Button
} from '@mui/material';
// components
import Page from '../components/Page';
import Scrollbar from '../components/Scrollbar';
import SearchNotFound from '../components/SearchNotFound';
import { UserListHead, UserListToolbar, UserMoreMenu } from '../components/_dashboard/user';
//
import { CategoriesContext } from 'contexts/CategoriesContext';
import { useToggleInput } from 'hooks';
import ConfirmDelete from 'components/dialogs/ConfirmDelete';
import { Icon } from '@iconify/react';
import AddCategory from 'components/category/AddCategory';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'id', label: 'Id', alignRight: false },
  { id: 'name', label: 'Name', alignRight: false },
  { id: 'createdAt', label: 'Creation Date', alignRight: false },
  { id: '' }
];

// ----------------------------------------------------------------------

function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function applySortFilter(array, comparator, query) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  if (query) {
    return filter(array, (_user) => _user.name.toLowerCase().indexOf(query.toLowerCase()) !== -1);
  }
  return stabilizedThis.map((el) => el[0]);
}

export default function User() {
  const { categories, loading, deleteCategory, editCategory, createCategory } =
    useContext(CategoriesContext);
  const [page, setPage] = useState(0);
  const [order, setOrder] = useState('asc');
  const [selected, setSelected] = useState([]);
  const [orderBy, setOrderBy] = useState('name');
  const [filterName, setFilterName] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [filteredCategories, setFilteredUsers] = useState([]);
  const [isDeleteOpen, toggleDeleteOpen] = useToggleInput(false);
  const [deleteItemId, setDeleteItemId] = useState(null);

  const [isAddOpen, toggleAddOpen] = useToggleInput(false);
  const [isEditOpen, toggleEditOpen] = useToggleInput(false);
  const [editItem, setEditItem] = useState(null);

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterByName = (event) => {
    setFilterName(event.target.value);
  };

  const handleDeleteSuccess = (event) => {
    setDeleteItemId();
    toggleDeleteOpen();

    deleteCategory(deleteItemId);
  };
  const handleEditSuccess = (body) => {
    toggleEditOpen();
    console.log(`body`, body);
    editCategory(editItem?._id, body);
    setEditItem();
  };
  const handleAddSuccess = (body) => {
    toggleAddOpen();

    createCategory(body);
  };

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - categories.length) : 0;

  useEffect(() => {
    if (loading || !categories) return;

    let newUsers = applySortFilter(categories, getComparator(order, orderBy), filterName);
    setFilteredUsers(newUsers);
  }, [categories, loading, order, orderBy, filterName, getComparator]);

  const isUserNotFound = filteredCategories.length === 0;

  const handleDelete = (delId) => {
    setDeleteItemId(delId);
    setTimeout(() => {
      toggleDeleteOpen();
    }, 500);
  };
  const handleEdit = (item) => {
    setEditItem(item);
    setTimeout(() => {
      toggleEditOpen();
    }, 500);
  };

  return (
    <Page title="Categories | Auction-App">
      <Container>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h4" gutterBottom>
            Categories
          </Typography>
          <Button variant="contained" startIcon={<Icon icon={plusFill} />} onClick={toggleAddOpen}>
            New Category
          </Button>
        </Stack>

        <Card>
          <UserListToolbar
            numSelected={selected.length}
            filterName={filterName}
            onFilterName={handleFilterByName}
            searchSlug="Search Categories"
          />

          <Scrollbar>
            <TableContainer sx={{ minWidth: 800 }}>
              <Table>
                <UserListHead
                  order={order}
                  orderBy={orderBy}
                  headLabel={TABLE_HEAD}
                  rowCount={categories.length}
                  numSelected={selected.length}
                  onRequestSort={handleRequestSort}
                />
                <TableBody>
                  {loading
                    ? Array(5)
                        .fill()
                        .map((_, idx) => (
                          <TableRow key={idx} hover>
                            <TableCell>
                              <Skeleton variant="circular" />
                            </TableCell>
                            {Array(4)
                              .fill()
                              .map((_, idx) => (
                                <TableCell key={idx * 2}>
                                  <Skeleton />
                                </TableCell>
                              ))}
                          </TableRow>
                        ))
                    : filteredCategories
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((row) => {
                          const { _id, name, createdAt } = row;
                          const isItemSelected = selected.indexOf(name) !== -1;

                          return (
                            <TableRow
                              hover
                              key={_id}
                              tabIndex={-1}
                              role="checkbox"
                              selected={isItemSelected}
                              aria-checked={isItemSelected}
                            >
                              <TableCell padding="checkbox" />
                              <TableCell align="left">{_id}</TableCell>
                              <TableCell component="th" scope="row" padding="none">
                                <Typography variant="subtitle2" noWrap>
                                  {name}
                                </Typography>
                              </TableCell>
                              {/* <TableCell align="left">{role}</TableCell> */}
                              <TableCell align="left">
                                {new Date(createdAt).toLocaleDateString()}
                              </TableCell>

                              <TableCell align="right">
                                <UserMoreMenu
                                  row={row}
                                  onDelete={handleDelete}
                                  onEdit={handleEdit}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                  {emptyRows > 0 && (
                    <TableRow style={{ height: 53 * emptyRows }}>
                      <TableCell colSpan={6} />
                    </TableRow>
                  )}
                </TableBody>
                {isUserNotFound && (
                  <TableBody>
                    <TableRow>
                      <TableCell align="center" colSpan={6} sx={{ py: 3 }}>
                        <SearchNotFound searchQuery={filterName} />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                )}
              </Table>
            </TableContainer>
          </Scrollbar>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={categories.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Card>
        <ConfirmDelete
          open={isDeleteOpen}
          toggleDialog={toggleDeleteOpen}
          title="Delete this category"
          handleSuccess={handleDeleteSuccess}
        />
        <AddCategory
          open={isAddOpen}
          toggleDialog={toggleAddOpen}
          title="Create this category"
          handleSuccess={handleAddSuccess}
        />

        {/* This will act as update category dialog */}
        <AddCategory
          open={isEditOpen}
          toggleDialog={toggleEditOpen}
          title="Update this category"
          handleSuccess={handleEditSuccess}
          isUpdate
          editItem={editItem}
        />
      </Container>
    </Page>
  );
}
