import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { MoreHorizontal, Pencil, PenSquare, Plus, Trash2 } from 'lucide-react';
import Card, { CardHeader } from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Input, { Select, Textarea } from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Dropdown from '../../components/ui/Dropdown';
import Pagination from '../../components/ui/Pagination';
import SearchInput from '../../components/ui/SearchInput';
import FileUpload from '../../components/ui/FileUpload';
import { StatusBadge } from '../../components/ui/Badge';
import { blogService } from '../../services/contentService';
import { API_BASE_URL } from '../../services/api';
import { BLOG_STATUS, metaFor, toOptions } from '../../utils/constants';
import { formatDate, paginate } from '../../utils/format';
import { getErrorMessage, getFieldErrors } from '../../utils/errors';
import { useDebounce } from '../../hooks/useDebounce';

const EMPTY = { title: '', excerpt: '', content: '', status: 'draft', published_at: '', tags: '' };

export default function Blog() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const [modal, setModal] = useState({ open: false, post: null });
  const [form, setForm] = useState(EMPTY);
  const [image, setImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, id: null });
  const [deleting, setDeleting] = useState(false);

  const debouncedSearch = useDebounce(search, 400);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await blogService.getAll({
        all: 1,
        page,
        per_page: 15,
        status: status || undefined,
      });
      setRows(data.data ?? []);
      setMeta(paginate(data).meta);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [status]);

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const openCreate = () => {
    setForm(EMPTY);
    setImage(null);
    setErrors({});
    setModal({ open: true, post: null });
  };

  const openEdit = (post) => {
    setForm({
      title: post.title ?? '',
      excerpt: post.excerpt ?? '',
      content: post.content ?? '',
      status: post.status ?? 'draft',
      published_at: post.published_at ? String(post.published_at).slice(0, 10) : '',
      tags: (post.tags ?? []).join(', '),
    });
    setImage(null);
    setErrors({});
    setModal({ open: true, post });
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const payload = {
        title: form.title,
        excerpt: form.excerpt,
        content: form.content,
        status: form.status,
        published_at: form.published_at || null,
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      };

      if (modal.post) {
        await blogService.update(modal.post.id, payload);
        toast.success('Post updated');
      } else {
        // FormData so the optional featured image rides along.
        const body = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
          if (value === null || value === undefined) return;
          if (key === 'tags') value.forEach((tag) => body.append('tags[]', tag));
          else body.append(key, value);
        });
        if (image) body.append('featured_image', image);
        await blogService.create(body);
        toast.success('Post created');
      }
      setModal({ open: false, post: null });
      load();
    } catch (error) {
      setErrors(getFieldErrors(error));
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await blogService.delete(confirm.id);
      toast.success('Post deleted');
      setConfirm({ open: false, id: null });
      load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  };

  const filtered = useMemo(() => {
    if (!debouncedSearch) return rows;
    const term = debouncedSearch.toLowerCase();
    return rows.filter((row) => row.title?.toLowerCase().includes(term));
  }, [rows, debouncedSearch]);

  const columns = useMemo(
    () => [
      {
        key: 'title',
        header: 'Post',
        render: (row) => (
          <div className="flex items-center gap-3">
            {row.featured_image ? (
              <img
                src={`${API_BASE_URL}/storage/${row.featured_image}`}
                alt=""
                className="h-10 w-14 shrink-0 rounded-lg object-cover"
              />
            ) : (
              <span className="flex h-10 w-14 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400 dark:bg-slate-800">
                <PenSquare size={16} />
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-800 dark:text-slate-100">{row.title}</p>
              <p className="truncate text-xs text-slate-400">{row.author?.name}</p>
            </div>
          </div>
        ),
      },
      { key: 'status', header: 'Status', render: (row) => <StatusBadge meta={metaFor(BLOG_STATUS, row.status)} /> },
      {
        key: 'tags',
        header: 'Tags',
        render: (row) => (row.tags?.length ? row.tags.slice(0, 3).join(', ') : '—'),
      },
      {
        key: 'published_at',
        header: 'Published',
        render: (row) => <span className="text-slate-500">{formatDate(row.published_at)}</span>,
      },
      {
        key: 'actions',
        header: '',
        headerClassName: 'text-right',
        className: 'text-right',
        render: (row) => (
          <div className="flex justify-end">
            <Dropdown
              trigger={
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <MoreHorizontal size={16} />
                </span>
              }
              items={[
                { label: 'Edit', icon: Pencil, onClick: () => openEdit(row) },
                { divider: true },
                { label: 'Delete', icon: Trash2, danger: true, onClick: () => setConfirm({ open: true, id: row.id }) },
              ]}
            />
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Blog"
          subtitle="Publish articles to the marketing site"
          action={
            <Button size="sm" onClick={openCreate}>
              <Plus size={15} /> New post
            </Button>
          }
        />

        <div className="mb-5 flex flex-col gap-3 sm:flex-row">
          <SearchInput value={search} onChange={setSearch} placeholder="Search posts…" className="sm:max-w-xs" />
          <Select value={status} onChange={(e) => setStatus(e.target.value)} containerClassName="sm:max-w-[180px]" aria-label="Filter by status">
            <option value="">All statuses</option>
            {toOptions(BLOG_STATUS).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <Table
          columns={columns}
          rows={filtered}
          loading={loading}
          empty={
            <div className="py-14 text-center">
              <PenSquare className="mx-auto text-slate-300" size={28} />
              <p className="mt-3 font-medium text-slate-600 dark:text-slate-300">No posts yet</p>
              <p className="mt-1 text-sm text-slate-400">Write your first article.</p>
            </div>
          }
        />

        <Pagination className="mt-6" meta={meta} onPageChange={setPage} />
      </Card>

      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false, post: null })}
        size="lg"
        title={modal.post ? 'Edit post' : 'New post'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal({ open: false, post: null })}>
              Cancel
            </Button>
            <Button onClick={submit} loading={saving}>
              {modal.post ? 'Save changes' : 'Publish post'}
            </Button>
          </>
        }
      >
        <form onSubmit={submit} className="space-y-4">
          <Input label="Title" value={form.title} onChange={set('title')} error={errors.title} required />
          <Textarea label="Excerpt" rows={2} value={form.excerpt} onChange={set('excerpt')} />
          <Textarea label="Content" rows={8} value={form.content} onChange={set('content')} error={errors.content} required />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Status" value={form.status} onChange={set('status')}>
              {toOptions(BLOG_STATUS).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Input
              label="Publish date"
              type="date"
              value={form.published_at}
              onChange={set('published_at')}
              hint="Leave blank to publish now."
            />
          </div>
          <Input
            label="Tags"
            value={form.tags}
            onChange={set('tags')}
            placeholder="design, product, news"
            hint="Comma-separated."
          />
          {!modal.post && (
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Featured image</p>
              <FileUpload accept="image/*" label="Upload a cover image" onFiles={setImage} />
            </div>
          )}
        </form>
      </Modal>

      <ConfirmDialog
        open={confirm.open}
        onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={remove}
        loading={deleting}
        title="Delete this post?"
        message="The article will be removed from the site."
        confirmLabel="Delete post"
      />
    </div>
  );
}
