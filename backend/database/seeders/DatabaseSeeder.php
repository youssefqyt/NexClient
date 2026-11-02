<?php

namespace Database\Seeders;

use App\Models\{
    User, Client, Company, Project, Task, TaskComment, Milestone,
    Invoice, InvoiceItem, Payment, SupportTicket, TicketMessage,
    Notification, ActivityLog, Setting, BlogPost, ContactMessage, Subscription
};
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        // ---------------------------------------------------------------- Roles
        $permissions = [
            'manage users', 'manage clients', 'manage projects', 'manage tasks',
            'manage invoices', 'manage tickets', 'manage blog', 'manage settings',
            'view analytics', 'view own projects', 'view own invoices', 'view own tickets',
        ];
        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $managerRole = Role::firstOrCreate(['name' => 'manager', 'guard_name' => 'web']);
        $clientRole = Role::firstOrCreate(['name' => 'client', 'guard_name' => 'web']);

        $adminRole->syncPermissions($permissions);
        $managerRole->syncPermissions([
            'manage clients', 'manage projects', 'manage tasks',
            'manage invoices', 'manage tickets', 'view analytics',
        ]);
        $clientRole->syncPermissions(['view own projects', 'view own invoices', 'view own tickets']);

        // ---------------------------------------------------------------- Users
        $admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin@nexclient.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'phone' => '+1 555 0100',
            'bio' => 'Agency founder and platform administrator.',
            'is_active' => true,
            'email_verified_at' => now(),
        ]);
        $admin->assignRole($adminRole);

        $manager = User::create([
            'name' => 'Morgan Lee',
            'email' => 'manager@nexclient.com',
            'password' => Hash::make('password'),
            'role' => 'manager',
            'phone' => '+1 555 0101',
            'bio' => 'Senior project manager overseeing delivery.',
            'is_active' => true,
            'email_verified_at' => now(),
        ]);
        $manager->assignRole($managerRole);

        $clientUser = User::create([
            'name' => 'John Doe',
            'email' => 'client@nexclient.com',
            'password' => Hash::make('password'),
            'role' => 'client',
            'is_active' => true,
            'email_verified_at' => now(),
        ]);
        $clientUser->assignRole($clientRole);

        $clientUser2 = User::create([
            'name' => 'Jane Smith',
            'email' => 'jane@example.com',
            'password' => Hash::make('password'),
            'role' => 'client',
            'is_active' => true,
            'email_verified_at' => now(),
        ]);
        $clientUser2->assignRole($clientRole);

        // ---------------------------------------------------------------- Companies
        $company1 = Company::create([
            'name' => 'Tech Solutions Inc',
            'email' => 'contact@techsolutions.com',
            'phone' => '+1234567890',
            'website' => 'https://techsolutions.com',
            'city' => 'New York',
            'country' => 'USA',
            'is_active' => true,
        ]);

        $company2 = Company::create([
            'name' => 'Digital Agency Co',
            'email' => 'hello@digitalagency.com',
            'phone' => '+1987654321',
            'city' => 'San Francisco',
            'country' => 'USA',
            'is_active' => true,
        ]);

        // ---------------------------------------------------------------- Clients
        $client1 = Client::create([
            'user_id' => $clientUser->id,
            'company_id' => $company1->id,
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'client@nexclient.com',
            'phone' => '+1234567890',
            'position' => 'CEO',
            'address' => '500 5th Avenue',
            'city' => 'New York',
            'state' => 'NY',
            'country' => 'USA',
            'postal_code' => '10110',
            'status' => 'active',
        ]);

        $client2 = Client::create([
            'user_id' => $clientUser2->id,
            'company_id' => $company2->id,
            'first_name' => 'Jane',
            'last_name' => 'Smith',
            'email' => 'jane@example.com',
            'phone' => '+1987654321',
            'position' => 'Marketing Director',
            'city' => 'San Francisco',
            'country' => 'USA',
            'status' => 'active',
        ]);

        // ---------------------------------------------------------------- Projects
        $project1 = Project::create([
            'title' => 'Website Redesign',
            'description' => 'Complete redesign of the company website with a modern UI/UX system.',
            'client_id' => $client1->id,
            'created_by' => $admin->id,
            'budget' => 15000.00,
            'currency' => 'USD',
            'start_date' => now()->subDays(20),
            'deadline' => now()->addMonths(3),
            'status' => 'in_progress',
            'priority' => 'high',
            'progress' => 45,
            'tags' => ['design', 'frontend', 'branding'],
        ]);

        $project2 = Project::create([
            'title' => 'Mobile App Development',
            'description' => 'Cross-platform iOS and Android e-commerce application.',
            'client_id' => $client2->id,
            'created_by' => $admin->id,
            'budget' => 50000.00,
            'currency' => 'USD',
            'start_date' => now()->subDays(30),
            'deadline' => now()->addMonths(6),
            'status' => 'in_progress',
            'priority' => 'urgent',
            'progress' => 30,
            'tags' => ['mobile', 'react-native'],
        ]);

        $project3 = Project::create([
            'title' => 'Brand Identity Package',
            'description' => 'Logo, typography and a full brand guideline document.',
            'client_id' => $client1->id,
            'created_by' => $manager->id,
            'budget' => 8000.00,
            'currency' => 'USD',
            'start_date' => now()->subMonths(2),
            'deadline' => now()->subDays(5),
            'status' => 'completed',
            'priority' => 'medium',
            'progress' => 100,
            'tags' => ['branding'],
        ]);

        $project1->members()->sync([$manager->id, $admin->id]);
        $project2->members()->sync([$manager->id]);
        $project3->members()->sync([$admin->id]);

        Milestone::create([
            'project_id' => $project1->id,
            'title' => 'Design sign-off',
            'description' => 'Final visual design approved by the client.',
            'due_date' => now()->addDays(10),
            'status' => 'in_progress',
        ]);
        Milestone::create([
            'project_id' => $project1->id,
            'title' => 'Frontend build complete',
            'due_date' => now()->addDays(45),
            'status' => 'pending',
        ]);

        // ---------------------------------------------------------------- Tasks
        $tasks = [
            [$project1, 'Design Homepage', 'Create a modern homepage with hero section.', $admin, 'done', 'high', now()->addDays(7), 100, ['design']],
            [$project1, 'Implement Responsive Layout', 'Make the site fully responsive.', $manager, 'in_progress', 'high', now()->addDays(14), 60, ['frontend']],
            [$project1, 'Accessibility Audit', 'WCAG AA review of key pages.', $manager, 'review', 'medium', now()->addDays(3), 85, ['a11y']],
            [$project2, 'Setup Development Environment', 'Configure React Native tooling.', $manager, 'done', 'high', now()->subDays(2), 100, ['setup']],
            [$project2, 'Authentication Screens', 'Login, register and password reset flows.', $admin, 'in_progress', 'urgent', now()->addDays(5), 40, ['mobile', 'auth']],
            [$project2, 'Payment Gateway Integration', 'Wire up Stripe checkout.', $admin, 'todo', 'high', now()->addDays(20), 0, ['payments']],
            [$project3, 'Logo Concepts', 'Deliver three logo directions.', $admin, 'done', 'medium', now()->subDays(20), 100, ['branding']],
        ];

        $createdTasks = collect();
        foreach ($tasks as $i => [$project, $title, $desc, $assignee, $status, $priority, $due, $progress, $labels]) {
            $createdTasks->push(Task::create([
                'project_id' => $project->id,
                'title' => $title,
                'description' => $desc,
                'assigned_to' => $assignee->id,
                'created_by' => $admin->id,
                'status' => $status,
                'priority' => $priority,
                'due_date' => $due,
                'order' => $i,
                'progress' => $progress,
                'labels' => $labels,
                'checklist' => [
                    ['label' => 'Kick-off', 'done' => true],
                    ['label' => 'Implementation', 'done' => $status === 'done'],
                    ['label' => 'Review', 'done' => $status === 'done'],
                ],
            ]));
        }

        TaskComment::create([
            'task_id' => $createdTasks[1]->id,
            'user_id' => $manager->id,
            'comment' => 'Breakpoints are done, still polishing the tablet layout.',
        ]);
        TaskComment::create([
            'task_id' => $createdTasks[1]->id,
            'user_id' => $admin->id,
            'comment' => 'Looks great. Let us ship it once mobile is verified.',
        ]);

        // ---------------------------------------------------------------- Invoices
        $invoice1 = Invoice::create([
            'client_id' => $client1->id,
            'project_id' => $project1->id,
            'created_by' => $admin->id,
            'invoice_date' => now()->subDays(10),
            'due_date' => now()->addDays(20),
            'status' => 'sent',
            'tax_rate' => 10,
            'currency' => 'USD',
        ]);
        InvoiceItem::create(['invoice_id' => $invoice1->id, 'description' => 'Website Design - Phase 1', 'quantity' => 1, 'unit_price' => 5000.00]);
        InvoiceItem::create(['invoice_id' => $invoice1->id, 'description' => 'Frontend Development', 'quantity' => 40, 'unit_price' => 100.00]);
        $invoice1->load('items')->calculateTotal();

        $invoice2 = Invoice::create([
            'client_id' => $client2->id,
            'project_id' => $project2->id,
            'created_by' => $admin->id,
            'invoice_date' => now()->subMonths(1),
            'due_date' => now()->addDays(15),
            'status' => 'paid',
            'tax_rate' => 10,
            'currency' => 'USD',
        ]);
        InvoiceItem::create(['invoice_id' => $invoice2->id, 'description' => 'Mobile App - Discovery & Design', 'quantity' => 1, 'unit_price' => 12000.00]);
        $invoice2->load('items')->calculateTotal();
        Payment::create([
            'invoice_id' => $invoice2->id,
            'amount' => $invoice2->total,
            'payment_method' => 'bank_transfer',
            'payment_date' => now()->subDays(20),
            'notes' => 'Paid in full.',
        ]);

        $invoice3 = Invoice::create([
            'client_id' => $client1->id,
            'project_id' => $project3->id,
            'created_by' => $manager->id,
            'invoice_date' => now()->subMonths(2),
            'due_date' => now()->subDays(15),
            'status' => 'overdue',
            'tax_rate' => 0,
            'currency' => 'USD',
        ]);
        InvoiceItem::create(['invoice_id' => $invoice3->id, 'description' => 'Brand Identity Package', 'quantity' => 1, 'unit_price' => 8000.00]);
        $invoice3->load('items')->calculateTotal();

        // ---------------------------------------------------------------- Tickets
        $ticket1 = SupportTicket::create([
            'client_id' => $clientUser->id,
            'subject' => 'Question about project timeline',
            'description' => 'Can we extend the Website Redesign deadline by two weeks?',
            'category' => 'general',
            'priority' => 'medium',
            'status' => 'open',
        ]);
        TicketMessage::create([
            'ticket_id' => $ticket1->id,
            'user_id' => $admin->id,
            'message' => 'Thanks for reaching out! Reviewing the schedule and will confirm shortly.',
        ]);

        $ticket2 = SupportTicket::create([
            'client_id' => $clientUser2->id,
            'subject' => 'Unable to log in to the portal',
            'description' => 'I keep getting an invalid credentials error even after resetting my password.',
            'category' => 'technical',
            'priority' => 'high',
            'status' => 'in_progress',
            'assigned_to' => $manager->id,
        ]);
        TicketMessage::create([
            'ticket_id' => $ticket2->id,
            'user_id' => $manager->id,
            'message' => 'We found a session caching issue and are deploying a fix today.',
        ]);
        TicketMessage::create([
            'ticket_id' => $ticket2->id,
            'user_id' => $manager->id,
            'message' => 'Internal: confirm the cache driver on staging before closing.',
            'is_internal' => true,
        ]);

        // ---------------------------------------------------------------- Notifications
        Notification::create([
            'user_id' => $clientUser->id,
            'type' => 'invoice_created',
            'title' => 'New invoice available',
            'message' => 'Invoice '.$invoice1->invoice_number.' is ready to view.',
            'data' => ['invoice_id' => $invoice1->id],
        ]);
        Notification::create([
            'user_id' => $clientUser->id,
            'type' => 'ticket_reply',
            'title' => 'New reply on your ticket',
            'message' => 'Support replied to "Question about project timeline".',
            'data' => ['ticket_id' => $ticket1->id],
        ]);
        Notification::create([
            'user_id' => $admin->id,
            'type' => 'ticket_created',
            'title' => 'New support ticket',
            'message' => $ticket2->ticket_number.': '.$ticket2->subject,
            'data' => ['ticket_id' => $ticket2->id],
        ]);

        // ---------------------------------------------------------------- Activity log
        foreach ([
            ['project.created', $project1, $admin],
            ['project.created', $project2, $admin],
            ['task.updated', $createdTasks[1], $manager],
            ['invoice.created', $invoice1, $admin],
            ['ticket.replied', $ticket2, $manager],
        ] as [$action, $model, $user]) {
            ActivityLog::create([
                'user_id' => $user->id,
                'action' => $action,
                'model_type' => get_class($model),
                'model_id' => $model->id,
                'properties' => ['seeded' => true],
                'ip_address' => '127.0.0.1',
            ]);
        }

        // ---------------------------------------------------------------- Subscriptions
        Subscription::create([
            'user_id' => $clientUser->id,
            'plan_name' => 'Agency Pro',
            'price' => 199.00,
            'billing_cycle' => 'monthly',
            'status' => 'active',
            'start_date' => now()->subMonths(2),
            'next_billing_date' => now()->addDays(12),
        ]);

        // ---------------------------------------------------------------- Settings
        $settings = [
            ['site_name', 'NexClient', 'string', 'general'],
            ['site_tagline', 'Client & Project Management, supercharged by AI', 'string', 'general'],
            ['site_description', 'NexClient helps freelancers and agencies manage clients, projects, invoices and support in one place.', 'string', 'seo'],
            ['primary_color', '#4f46e5', 'string', 'appearance'],
            ['secondary_color', '#0ea5e9', 'string', 'appearance'],
            ['currency', 'USD', 'string', 'general'],
            ['tax_rate', '10', 'number', 'financial'],
            ['items_per_page', '15', 'number', 'general'],
            ['default_locale', 'en', 'string', 'general'],
            ['contact_email', 'support@nexclient.com', 'string', 'contact'],
            ['contact_phone', '+1 555 0100', 'string', 'contact'],
            ['social_twitter', 'https://twitter.com/nexclient', 'string', 'social'],
            ['social_linkedin', 'https://linkedin.com/company/nexclient', 'string', 'social'],
            ['social_facebook', 'https://facebook.com/nexclient', 'string', 'social'],
            ['seo_title', 'NexClient — AI Client & Project Management', 'string', 'seo'],
            ['seo_description', 'Manage clients, projects, invoices and support with an AI copilot built for agencies.', 'string', 'seo'],
            ['seo_keywords', 'client management, project management, agency, invoicing, AI', 'string', 'seo'],
        ];
        foreach ($settings as [$key, $value, $type, $group]) {
            Setting::create(compact('key', 'value', 'type', 'group'));
        }

        // ---------------------------------------------------------------- Blog
        BlogPost::create([
            'author_id' => $admin->id,
            'title' => 'Welcome to NexClient',
            'excerpt' => 'Introducing our new AI-powered client management platform.',
            'content' => "NexClient brings clients, projects, invoices and support into a single workspace.\n\nWe built it because agencies deserve tooling that keeps up with them.",
            'tags' => ['announcement', 'product'],
            'status' => 'published',
            'published_at' => now()->subDays(5),
        ]);
        BlogPost::create([
            'author_id' => $manager->id,
            'title' => '5 Ways to Keep Client Projects on Track',
            'excerpt' => 'Practical habits for shipping client work on time, every time.',
            'content' => "Scope creep is the enemy of delivery. Here are five habits our team uses.\n\n1. Define milestones up front.\n2. Review progress weekly.\n3. Keep one source of truth.",
            'tags' => ['process', 'delivery'],
            'status' => 'published',
            'published_at' => now()->subDays(2),
        ]);
        BlogPost::create([
            'author_id' => $admin->id,
            'title' => 'Draft: AI in Agency Workflows',
            'excerpt' => 'A look at where AI actually saves time.',
            'content' => 'Draft content...',
            'status' => 'draft',
        ]);

        // ---------------------------------------------------------------- Contact messages
        ContactMessage::create([
            'name' => 'Sara Ahmed',
            'email' => 'sara@example.com',
            'subject' => 'Pricing for a 5-person team',
            'message' => 'Hi, we are a small agency and would like to know more about your team plan.',
            'status' => 'new',
        ]);

        $this->command->info('Database seeded successfully!');
        $this->command->info('Admin: admin@nexclient.com / password');
        $this->command->info('Manager: manager@nexclient.com / password');
        $this->command->info('Client: client@nexclient.com / password');
    }
}
