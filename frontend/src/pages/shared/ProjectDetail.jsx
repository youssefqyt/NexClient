import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Activity as ActivityIcon,
  ArrowLeft,
  CalendarDays,
  DollarSign,
  Flag,
  Plus,
  Sparkles,
  Trash2,
  Users,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge, { StatusBadge } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input, { Select, Textarea } from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import ProgressBar from '../../components/ui/ProgressBar';
import Tabs from '../../components/ui/Tabs';
import Avatar from '../../components/ui/Avatar';
import EmptyState from '../../components/ui/EmptyState';
import { PageLoader } from '../../components/ui/Spinner';
import KanbanBoard from '../../components/kanban/KanbanBoard';
import TaskModal from '../../components/kanban/TaskModal';
import { projectService } from '../../services/projectService';
import { taskService } from '../../services/taskService';
import { aiService } from '../../services/aiService';
import { useAuth } from '../../hooks/useAuth';
import { basePath } from '../../router/paths';
import {
  MILESTONE_STATUS,
  PRIORITY,
  PROJECT_STATUS,
  metaFor,
  toOptions,
} from '../../utils/constants';
import { clientName, formatCurrency, formatDate, timeAgo } from '../../utils/format';
import { getErrorMessage, getFieldErrors } from '../../utils/errors';

const EMPTY_MILESTONE = { title: '', description: '', due_date: '', status: 'pending' };

export default function ProjectDetail() {
  const { id } = useParams();
  const { user, isStaff } = useAuth();
  const base = basePath(user);

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('board');
  const [activity, setActivity] = useState([]);

  const [taskModal, setTaskModal] = useState({ open: false, task: null, status: 'todo' });
  const [milestoneModal, setMilestoneModal] = useState({ open: false, milestone: null });
  const [milestone, setMilestone] = useState(EMPTY_MILESTONE);
  const [mErrors, setMErrors] = useState({});
  const [savingMilestone, setSavingMilestone] = useState(false);
  const [confirmMilestone, setConfirmMilestone] = useState({ open: false, id: null });

  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await projectService.getById(id);
      setProject(data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (tab !== 'activity') return;
    projectService
      .getActivity(id)
      .then(({ data }) => setActivity(data.activity ?? []))
      .catch(() => setActivity([]));
  }, [tab, id]);

  const saveMilestone = async (e) => {
    e?.preventDefault();
    setSavingMilestone(true);
    setMErrors({});
    try {
      if (milestoneModal.milestone) {
        await projectService.updateMilestone(id, milestoneModal.milestone.id, milestone);
        toast.success('Milestone updated');
      } else {
        await projectService.createMilestone(id, milestone);
        toast.success('Milestone added');
      }
      setMilestoneModal({ open: false, milestone: null });
      load();
    } catch (error) {
      setMErrors(getFieldErrors(error));
      toast.error(getErrorMessage(error));
    } finally {
      setSavingMilestone(false);
    }
  };

  const removeMilestone = async () => {
    try {
      await projectService.deleteMilestone(id, confirmMilestone.id);
      toast.success('Milestone deleted');
      setConfirmMilestone({ open: false, id: null });
      load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const runSummarize = async () => {
    setAiLoading(true);
    try {
      const { data } = await aiService.summarizeProject(project.id);
      setAiResult(data.result);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setAiLoading(false);
    }
  };

  const onReorder = async (payload) => {
    try {
      await taskService.reorder(payload);
    } catch (error) {
      toast.error(getErrorMessage(error));
      load();
    }
  };

  if (loading) return <PageLoader label="Loading project…" />;
  if (!project) {
    return (
      <EmptyState
        title="Project not found"
        description="It may have been deleted."
        actionLabel="Back to projects"
        actionTo={`${base}/projects`}
      />
    );
  }

  const tasks = project.tasks ?? [];
  const milestones = project.milestones ?? [];
  const members = project.members ?? [];

  const tabs = [
    { key: 'board', label: 'Board', count: tasks.length },
    { key: 'milestones', label: 'Milestones', count: milestones.length },
    { key: 'activity', label: 'Activity' },
  ];

  return (
    <div className="space-y-6">
      <Link
        to={`${base}/projects`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-brand-600"
      >
        <ArrowLeft size={15} /> Back to projects
      </Link>

      {/* Header */}
      <Card>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{project.title}</h2>
              <StatusBadge meta={metaFor(PROJECT_STATUS, project.status)} />
              <Badge tone="slate">
                <Flag size={12} /> {metaFor(PRIORITY, project.priority).label}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {clientName(project.client)}
              {project.client?.company?.name ? ` · ${project.client.company.name}` : ''}
            </p>
            {project.description && (
              <p className="mt-3 max-w-3xl text-sm text-slate-600 dark:text-slate-400">
                {project.description}
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays size={14} /> {formatDate(project.start_date)} → {formatDate(project.deadline)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <DollarSign size={14} /> {formatCurrency(project.budget, project.currency)}
              </span>
              {!!members.length && (
                <span className="inline-flex items-center gap-1.5">
                  <Users size={14} /> {members.length} member{members.length === 1 ? '' : 's'}
                </span>
              )}
            </div>

            <div className="mt-4 max-w-md">
              <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
                <span>Progress</span>
                <span>{project.progress}%</span>
              </div>
              <ProgressBar value={project.progress} />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {isStaff && (
              <>
                <Button variant="secondary" onClick={runSummarize} loading={aiLoading}>
                  <Sparkles size={15} /> AI summary
                </Button>
                <Button onClick={() => setTaskModal({ open: true, task: null, status: 'todo' })}>
                  <Plus size={15} /> New task
                </Button>
              </>
            )}
          </div>
        </div>

        {aiResult && (
          <div className="mt-5 rounded-xl border border-brand-200 bg-brand-50/60 p-4 text-sm text-slate-700 dark:border-brand-900 dark:bg-brand-950/30 dark:text-slate-200">
            <div className="mb-1.5 flex items-center gap-2 font-semibold text-brand-700 dark:text-brand-300">
              <Sparkles size={15} /> AI project summary
            </div>
            <p className="whitespace-pre-wrap leading-relaxed">{aiResult}</p>
          </div>
        )}

        {!!members.length && (
          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Team</span>
            <div className="flex flex-wrap gap-2">
              {members.map((member) => (
                <span
                  key={member.id}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 py-1 pl-1 pr-3 text-sm dark:border-slate-700"
                >
                  <Avatar name={member.name} src={member.avatar_url} size={24} />
                  <span className="text-slate-600 dark:text-slate-300">{member.name}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </Card>

      <div className="flex items-center justify-between gap-4">
        <Tabs tabs={tabs} active={tab} onChange={setTab} />
        {tab === 'milestones' && isStaff && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setMilestone(EMPTY_MILESTONE);
              setMilestoneModal({ open: true, milestone: null });
            }}
          >
            <Plus size={15} /> Add milestone
          </Button>
        )}
      </div>

      {tab === 'board' && (
        <KanbanBoard
          tasks={tasks}
          onOpenTask={(task) => setTaskModal({ open: true, task, status: task.status })}
          onAddTask={isStaff ? (status) => setTaskModal({ open: true, task: null, status }) : undefined}
          onReorder={isStaff ? onReorder : undefined}
        />
      )}

      {tab === 'milestones' && (
        <Card>
          {milestones.length ? (
            <ul className="space-y-3">
              {milestones.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start justify-between gap-4 rounded-xl border border-slate-100 p-4 dark:border-slate-800"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-slate-800 dark:text-slate-100">{item.title}</p>
                      <StatusBadge meta={metaFor(MILESTONE_STATUS, item.status)} />
                    </div>
                    {item.description && (
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.description}</p>
                    )}
                    <p className="mt-1 text-xs text-slate-400">Due {formatDate(item.due_date)}</p>
                  </div>
                  {isStaff && (
                    <div className="flex shrink-0 gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setMilestone({
                            title: item.title ?? '',
                            description: item.description ?? '',
                            due_date: item.due_date ? String(item.due_date).slice(0, 10) : '',
                            status: item.status ?? 'pending',
                          });
                          setMilestoneModal({ open: true, milestone: item });
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setConfirmMilestone({ open: true, id: item.id })}
                      >
                        <Trash2 size={14} className="text-rose-500" />
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={Flag}
              title="No milestones yet"
              description="Break the project into checkpoints to track delivery."
              className="py-10"
            />
          )}
        </Card>
      )}

      {tab === 'activity' && (
        <Card>
          {activity.length ? (
            <ul className="space-y-4">
              {activity.map((log) => (
                <li key={log.id} className="flex gap-3">
                  <Avatar name={log.user?.name} src={log.user?.avatar_url} size={32} />
                  <div>
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {log.user?.name ?? 'System'}
                      </span>{' '}
                      {log.action}
                    </p>
                    <p className="text-xs text-slate-400">{timeAgo(log.created_at)}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={ActivityIcon} title="No activity yet" className="py-10" />
          )}
        </Card>
      )}

      <TaskModal
        open={taskModal.open}
        onClose={() => setTaskModal({ open: false, task: null })}
        task={taskModal.task}
        projects={[{ id: project.id, title: project.title }]}
        defaultProjectId={project.id}
        onSaved={load}
      />

      {/* Milestone modal */}
      <Modal
        open={milestoneModal.open}
        onClose={() => setMilestoneModal({ open: false, milestone: null })}
        title={milestoneModal.milestone ? 'Edit milestone' : 'Add milestone'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setMilestoneModal({ open: false, milestone: null })}>
              Cancel
            </Button>
            <Button onClick={saveMilestone} loading={savingMilestone}>
              {milestoneModal.milestone ? 'Save changes' : 'Add milestone'}
            </Button>
          </>
        }
      >
        <form onSubmit={saveMilestone} className="space-y-4">
          <Input
            label="Title"
            value={milestone.title}
            onChange={(e) => setMilestone((p) => ({ ...p, title: e.target.value }))}
            error={mErrors.title}
            required
          />
          <Textarea
            label="Description"
            rows={2}
            value={milestone.description}
            onChange={(e) => setMilestone((p) => ({ ...p, description: e.target.value }))}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Due date"
              type="date"
              value={milestone.due_date}
              onChange={(e) => setMilestone((p) => ({ ...p, due_date: e.target.value }))}
              error={mErrors.due_date}
              required
            />
            <Select
              label="Status"
              value={milestone.status}
              onChange={(e) => setMilestone((p) => ({ ...p, status: e.target.value }))}
            >
              {toOptions(MILESTONE_STATUS).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmMilestone.open}
        onClose={() => setConfirmMilestone({ open: false, id: null })}
        onConfirm={removeMilestone}
        title="Delete this milestone?"
        message="This cannot be undone."
        confirmLabel="Delete"
      />
    </div>
  );
}
