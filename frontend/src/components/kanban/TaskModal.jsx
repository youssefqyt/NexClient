import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { MessageSquare, Paperclip, Send, Trash2 } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input, { Select, Textarea } from '../ui/Input';
import Avatar from '../ui/Avatar';
import FileUpload from '../ui/FileUpload';
import Tabs from '../ui/Tabs';
import { PRIORITY, TASK_STATUS, toOptions } from '../../utils/constants';
import { formatDateTime, formatFileSize } from '../../utils/format';
import { getErrorMessage, getFieldErrors } from '../../utils/errors';
import { taskService } from '../../services/taskService';
import { userService } from '../../services/userService';
import { useAuth } from '../../hooks/useAuth';
import { API_BASE_URL } from '../../services/api';

const EMPTY = {
  project_id: '',
  title: '',
  description: '',
  assigned_to: '',
  status: 'todo',
  priority: 'medium',
  due_date: '',
  labels: '',
};

/**
 * Create / edit dialog for a task. When editing it also surfaces the comment
 * thread and file attachments so the whole task lifecycle is available without
 * leaving the board.
 */
export default function TaskModal({ open, onClose, task, projects = [], defaultProjectId, onSaved }) {
  const { user } = useAuth();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [agents, setAgents] = useState([]);

  const [detail, setDetail] = useState(null);
  const [tab, setTab] = useState('details');
  const [comment, setComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const isEdit = Boolean(task?.id);

  useEffect(() => {
    if (!open) return;
    userService
      .assignable()
      .then(({ data }) => setAgents(data.users ?? []))
      .catch(() => setAgents([]));
  }, [open]);

  // Seed the form from the row (edit) or the defaults (create).
  useEffect(() => {
    if (!open) return;
    setErrors({});
    setTab('details');
    setComment('');
    setDetail(null);

    if (isEdit) {
      setForm({
        project_id: String(task.project_id ?? ''),
        title: task.title ?? '',
        description: task.description ?? '',
        assigned_to: task.assigned_to ? String(task.assigned_to) : '',
        status: task.status ?? 'todo',
        priority: task.priority ?? 'medium',
        due_date: task.due_date ? String(task.due_date).slice(0, 10) : '',
        labels: (task.labels ?? []).join(', '),
      });
      taskService
        .getById(task.id)
        .then(({ data }) => setDetail(data))
        .catch(() => {});
    } else {
      setForm({ ...EMPTY, project_id: String(defaultProjectId ?? '') });
    }
  }, [open, task, defaultProjectId, isEdit]);

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const reloadDetail = useCallback(async () => {
    if (!isEdit) return;
    const { data } = await taskService.getById(task.id);
    setDetail(data);
  }, [isEdit, task]);

  const submit = async (e) => {
    e?.preventDefault();
    setSaving(true);
    setErrors({});

    const payload = {
      ...form,
      project_id: form.project_id || undefined,
      assigned_to: form.assigned_to || null,
      due_date: form.due_date || null,
      labels: form.labels
        ? form.labels.split(',').map((l) => l.trim()).filter(Boolean)
        : [],
    };

    try {
      if (isEdit) {
        delete payload.project_id;
        await taskService.update(task.id, payload);
        toast.success('Task updated');
      } else {
        await taskService.create(payload);
        toast.success('Task created');
      }
      onSaved?.();
      onClose?.();
    } catch (error) {
      setErrors(getFieldErrors(error));
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const postComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setPosting(true);
    try {
      await taskService.addComment(task.id, comment.trim());
      setComment('');
      await reloadDetail();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setPosting(false);
    }
  };

  const deleteComment = async (commentId) => {
    try {
      await taskService.deleteComment(task.id, commentId);
      await reloadDetail();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const upload = async (file) => {
    setUploading(true);
    setProgress(0);
    try {
      await taskService.uploadAttachment(task.id, file, (evt) => {
        if (evt.total) setProgress(Math.round((evt.loaded / evt.total) * 100));
      });
      toast.success('File uploaded');
      await reloadDetail();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const deleteAttachment = async (attachmentId) => {
    try {
      await taskService.deleteAttachment(task.id, attachmentId);
      await reloadDetail();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const tabs = isEdit
    ? [
        { key: 'details', label: 'Details' },
        { key: 'comments', label: 'Comments', count: detail?.comments?.length ?? 0 },
        { key: 'files', label: 'Files', count: detail?.attachments?.length ?? 0 },
      ]
    : [{ key: 'details', label: 'Details' }];

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={isEdit ? 'Edit task' : 'New task'}
      description={isEdit ? task.title : 'Assign work to a teammate and track it on the board.'}
      footer={
        tab === 'details' ? (
          <>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={submit} loading={saving}>
              {isEdit ? 'Save changes' : 'Create task'}
            </Button>
          </>
        ) : null
      }
    >
      {isEdit && <Tabs tabs={tabs} active={tab} onChange={setTab} className="mb-5" />}

      {tab === 'details' && (
        <form onSubmit={submit} className="space-y-4">
          <Input
            label="Title"
            name="title"
            value={form.title}
            onChange={set('title')}
            error={errors.title}
            placeholder="e.g. Build the checkout flow"
            required
          />

          <Textarea
            label="Description"
            name="description"
            value={form.description}
            onChange={set('description')}
            error={errors.description}
            rows={3}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Project"
              name="project_id"
              value={form.project_id}
              onChange={set('project_id')}
              error={errors.project_id}
              disabled={isEdit}
              required
            >
              <option value="">Select a project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </Select>

            <Select
              label="Assignee"
              name="assigned_to"
              value={form.assigned_to}
              onChange={set('assigned_to')}
              error={errors.assigned_to}
            >
              <option value="">Unassigned</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} · {agent.role}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Select label="Status" name="status" value={form.status} onChange={set('status')}>
              {toOptions(TASK_STATUS).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>

            <Select label="Priority" name="priority" value={form.priority} onChange={set('priority')}>
              {toOptions(PRIORITY).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>

            <Input
              label="Due date"
              name="due_date"
              type="date"
              value={form.due_date}
              onChange={set('due_date')}
              error={errors.due_date}
            />
          </div>

          <Input
            label="Labels"
            name="labels"
            value={form.labels}
            onChange={set('labels')}
            placeholder="design, frontend, urgent"
            hint="Comma-separated."
          />
        </form>
      )}

      {tab === 'comments' && (
        <div className="space-y-4">
          <ul className="space-y-3">
            {(detail?.comments ?? []).map((item) => (
              <li key={item.id} className="flex gap-3">
                <Avatar name={item.user?.name} src={item.user?.avatar_url} size={32} />
                <div className="min-w-0 flex-1 rounded-xl bg-slate-50 px-3.5 py-2.5 dark:bg-slate-800/60">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {item.user?.name ?? 'User'}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400">{formatDateTime(item.created_at)}</span>
                      {item.user_id === user?.id && (
                        <button
                          type="button"
                          onClick={() => deleteComment(item.id)}
                          aria-label="Delete comment"
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">
                    {item.comment}
                  </p>
                </div>
              </li>
            ))}
            {!detail?.comments?.length && (
              <li className="flex flex-col items-center gap-2 py-10 text-sm text-slate-400">
                <MessageSquare size={22} /> No comments yet. Start the conversation.
              </li>
            )}
          </ul>

          <form onSubmit={postComment} className="flex items-end gap-2">
            <Input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write a comment…"
              containerClassName="flex-1"
            />
            <Button type="submit" size="icon" loading={posting} aria-label="Post comment">
              {!posting && <Send size={16} />}
            </Button>
          </form>
        </div>
      )}

      {tab === 'files' && (
        <div className="space-y-4">
          <FileUpload onFiles={upload} uploading={uploading} progress={progress} />

          <ul className="space-y-2">
            {(detail?.attachments ?? []).map((file) => (
              <li
                key={file.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3.5 py-2.5 dark:border-slate-800"
              >
                <a
                  href={`${API_BASE_URL}/storage/${file.path}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-w-0 items-center gap-2.5 text-sm font-medium text-slate-700 hover:text-brand-600 dark:text-slate-200"
                >
                  <Paperclip size={15} className="shrink-0 text-slate-400" />
                  <span className="truncate">{file.original_name}</span>
                </a>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">{formatFileSize(file.size)}</span>
                  <button
                    type="button"
                    onClick={() => deleteAttachment(file.id)}
                    aria-label="Delete attachment"
                    className="text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
            {!detail?.attachments?.length && (
              <li className="py-6 text-center text-sm text-slate-400">No files attached.</li>
            )}
          </ul>
        </div>
      )}
    </Modal>
  );
}
