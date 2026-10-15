-- PostgreSQL architecture reference only; NOT an executed migration or a provisioned backend.
-- Production requires authenticated roles, tenant isolation/RLS, secure PIN verification,
-- append-only audited writes, and exclusion/transaction checks for assignment overlaps.
CREATE TABLE warehouses (
 id text PRIMARY KEY, name text NOT NULL, time_zone text NOT NULL,
 performance_standard numeric NOT NULL DEFAULT 95 CHECK (performance_standard > 0 AND performance_standard <= 300)
);
CREATE TABLE shifts (
 warehouse_id text REFERENCES warehouses(id), id text, name text NOT NULL,
 local_start time NOT NULL, local_end time NOT NULL,
 end_day_offset smallint NOT NULL CHECK (end_day_offset IN (0,1)),
 PRIMARY KEY (warehouse_id,id)
);
CREATE TABLE departments (warehouse_id text REFERENCES warehouses(id), id text, name text NOT NULL, PRIMARY KEY (warehouse_id,id));
CREATE TABLE managers (warehouse_id text REFERENCES warehouses(id), id text, display_name text NOT NULL, PRIMARY KEY (warehouse_id,id));
CREATE TABLE employees (warehouse_id text REFERENCES warehouses(id), id text, display_name text NOT NULL, PRIMARY KEY (warehouse_id,id));
CREATE TABLE primary_assignment_history (
 warehouse_id text, id text, employee_id text NOT NULL, shift_id text NOT NULL,
 department_id text NOT NULL, manager_id text NOT NULL, effective_from date NOT NULL,
 effective_until date CHECK (effective_until IS NULL OR effective_until > effective_from),
 PRIMARY KEY (warehouse_id,id), UNIQUE (warehouse_id,employee_id,id),
 FOREIGN KEY (warehouse_id,employee_id) REFERENCES employees(warehouse_id,id),
 FOREIGN KEY (warehouse_id,shift_id) REFERENCES shifts(warehouse_id,id),
 FOREIGN KEY (warehouse_id,department_id) REFERENCES departments(warehouse_id,id),
 FOREIGN KEY (warehouse_id,manager_id) REFERENCES managers(warehouse_id,id)
);
-- Transfer: close prior half-open date interval, append new row in one transaction;
-- validate no overlap for an employee. Do not overwrite the old assignment.
CREATE TABLE work_assignments (
 warehouse_id text, id text, employee_id text NOT NULL, primary_assignment_id text NOT NULL,
 operational_work_date date NOT NULL, reporting_week date NOT NULL,
 shift_id text NOT NULL, department_id text NOT NULL, manager_id text NOT NULL,
 kind text NOT NULL CHECK (kind IN ('primary','temporary','overtime')),
 scheduled_minutes integer NOT NULL CHECK (scheduled_minutes >= 0),
 actual_start timestamptz, actual_end timestamptz,
 PRIMARY KEY (warehouse_id,id), UNIQUE (warehouse_id,employee_id,id),
 FOREIGN KEY (warehouse_id,employee_id,primary_assignment_id) REFERENCES primary_assignment_history(warehouse_id,employee_id,id),
 FOREIGN KEY (warehouse_id,shift_id) REFERENCES shifts(warehouse_id,id),
 FOREIGN KEY (warehouse_id,department_id) REFERENCES departments(warehouse_id,id),
 FOREIGN KEY (warehouse_id,manager_id) REFERENCES managers(warehouse_id,id)
);
-- Explicit operational date + shift resolves overlap/overnight/overtime. Never infer
-- eligibility from scheduled_minutes or change historical work when an employee transfers.
CREATE TABLE performance_revisions (
 warehouse_id text, employee_id text NOT NULL, work_assignment_id text, revision integer CHECK (revision >= 1),
 cases_completed integer NOT NULL CHECK (cases_completed >= 0),
 earned_hours numeric NOT NULL CHECK (earned_hours >= 0),
 eligible_productive_hours numeric NOT NULL CHECK (eligible_productive_hours > 0),
 official_assignment_percent numeric NOT NULL,
 finalization_status text NOT NULL CHECK (finalization_status IN ('pending','finalized','corrected')),
 finalized_at timestamptz, source_report_id text NOT NULL,
 PRIMARY KEY (warehouse_id,work_assignment_id,revision),
 FOREIGN KEY (warehouse_id,employee_id,work_assignment_id) REFERENCES work_assignments(warehouse_id,employee_id,id)
);
-- Approved official period summaries can be recorded separately and supersede sample
-- weighted calculations after the customer confirms their scope, eligibility and methodology.
CREATE TABLE approved_period_summaries (
 warehouse_id text, employee_id text, period_start date, period_end date,
 scope_key text, official_percent numeric NOT NULL, finalized_at timestamptz NOT NULL,
 source_report_id text NOT NULL,
 PRIMARY KEY (warehouse_id,employee_id,period_start,period_end,scope_key),
 FOREIGN KEY (warehouse_id,employee_id) REFERENCES employees(warehouse_id,id)
);
CREATE TABLE coaching_records (
 warehouse_id text, id text, employee_id text NOT NULL, manager_id text NOT NULL,
 meeting_at timestamptz NOT NULL, conversation_type text NOT NULL,
 manager_notes text NOT NULL, employee_response text,
 performance_snapshot jsonb NOT NULL, agreed_action_plan text NOT NULL, follow_up_date date,
 created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL, version integer NOT NULL,
 PRIMARY KEY (warehouse_id,id),
 FOREIGN KEY (warehouse_id,employee_id) REFERENCES employees(warehouse_id,id),
 FOREIGN KEY (warehouse_id,manager_id) REFERENCES managers(warehouse_id,id)
);
CREATE TABLE coaching_audit_events (
 warehouse_id text, id text, coaching_id text NOT NULL, employee_id text NOT NULL,
 actor_manager_id text NOT NULL, action text NOT NULL, occurred_at timestamptz NOT NULL,
 record_version integer NOT NULL,
 PRIMARY KEY (warehouse_id,id),
 FOREIGN KEY (warehouse_id,coaching_id) REFERENCES coaching_records(warehouse_id,id),
 FOREIGN KEY (warehouse_id,employee_id) REFERENCES employees(warehouse_id,id),
 FOREIGN KEY (warehouse_id,actor_manager_id) REFERENCES managers(warehouse_id,id)
);
-- Production: permit manager reads/writes only through server-authorized employee scopes;
-- preserve prior versions and append audit events. Department transfers never cascade-delete coaching.
CREATE TABLE legacy_report_archive (
 warehouse_id text REFERENCES warehouses(id), id text, schema_version text NOT NULL,
 original_report jsonb NOT NULL, mapping_state text NOT NULL DEFAULT 'unresolved',
 PRIMARY KEY (warehouse_id,id)
);
