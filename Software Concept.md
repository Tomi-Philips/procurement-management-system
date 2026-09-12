# MASTER SOFTWARE DEVELOPMENT PROMPT

## Design and Implementation of a Professional Procurement Management System

Act as a **senior full-stack software engineer, software architect, database architect, product designer, UX strategist, UI/UX designer, security engineer, and QA engineer**.

You are responsible for designing and implementing a complete, functional, production-quality **Procurement Management System**.

This is not a landing-page project, a visual mockup, or a collection of static dashboards. It is a functional information system designed to manage and streamline organizational procurement activities from the initial procurement request through approval, supplier engagement, quotation evaluation, purchase order processing, delivery monitoring, reporting, and auditing.

The system must feel like a **real software product designed and engineered by experienced professionals**.

---

# 1. PROJECT TITLE

**Design and Implementation of a Procurement Management System**

---

# 2. PROJECT AIM

The aim of this project is to design and implement a centralized Procurement Management System that automates and coordinates major procurement activities, improves the management of procurement records, supports supplier evaluation and selection, provides controlled approval workflows, and improves procurement efficiency, transparency, accountability, and monitoring.

---

# 3. PROJECT OBJECTIVES

The system should be designed to achieve the following objectives:

1. Design a centralized system for creating, managing, and tracking organizational procurement requests.

2. Implement a structured approval workflow that allows authorized personnel to review, approve, reject, or return procurement requests.

3. Provide functionality for managing suppliers and their relevant procurement information.

4. Implement quotation management and supplier evaluation to support informed supplier selection.

5. Provide purchase order management and delivery monitoring while maintaining accurate procurement records and generating useful procurement reports.

The final objective must naturally lead back to the overall project topic: **the design and implementation of a Procurement Management System**.

---

# 4. CORE PROBLEM THE SYSTEM SHOULD SOLVE

The system should address problems commonly associated with poorly coordinated or manual procurement processes, including:

* Paper-based procurement requests
* Difficulty tracking procurement requests
* Delays in approval
* Poor visibility of procurement status
* Scattered supplier information
* Difficulty comparing supplier quotations
* Poor supplier performance tracking
* Manual purchase order preparation
* Difficulty monitoring deliveries
* Difficulty retrieving historical procurement records
* Weak procurement activity monitoring
* Poor reporting
* Limited accountability
* Difficulty maintaining an audit trail

Do not exaggerate these problems or introduce unrelated organizational problems.

The system should remain focused specifically on **procurement management**.

---

# 5. TECHNOLOGY STACK

Use the following technology stack unless there is a strong technical reason to make a change:

### Frontend

* Next.js
* TypeScript
* React
* Tailwind CSS
* Lucide React

### Backend

Use the server-side capabilities of Next.js appropriately, including:

* Server Components where appropriate
* Server Actions where appropriate
* Route Handlers/API endpoints where appropriate
* Secure server-side database operations

### Database

* Supabase
* PostgreSQL

### Authentication

* Supabase Authentication

### Validation

* Zod
* React Hook Form

### Charts and data visualization

* Recharts only where charts genuinely help users understand procurement data.

### Notifications

* Sonner or an equivalent lightweight notification system.

### Date handling

* date-fns where necessary.

Do not introduce unnecessary frameworks or libraries.

---

# 6. IMPORTANT DEVELOPMENT PRINCIPLE

Do not treat this as a generic CRUD application.

Think through the **actual procurement workflow** before implementing individual pages.

The database architecture, business logic, user roles, approval process, supplier workflow, quotation workflow, purchase order workflow, and delivery workflow must all work together.

Every important UI element should have a real purpose.

If something is displayed in the interface, it should either:

* represent actual system data,
* perform a useful action,
* communicate meaningful system status,
* or help the user make a procurement decision.

Do not create interface elements simply because modern dashboards commonly contain them.

---

# 7. USER ROLES

Implement proper role-based access control.

The primary roles should be:

## Administrator

The administrator manages the overall system.

Responsibilities:

* Manage users
* Assign user roles
* Manage departments
* View procurement activities
* Manage system-level information
* View reports
* View audit logs
* Monitor overall procurement activity

The administrator should not automatically perform every procurement action unless the business rules explicitly permit it.

---

## Department Staff / Requester

Department staff can:

* Create procurement requests
* Add requested items
* Provide quantities and specifications
* Submit requests
* View their submitted requests
* Track request status
* View approval outcomes
* View relevant procurement progress

They should not be able to approve their own procurement requests.

---

## Approving Officer

Approving officers can:

* View procurement requests awaiting approval
* Review request details
* Review requested items
* Review estimated costs
* Approve requests
* Reject requests
* Return requests for correction
* Provide comments/reasons
* View previous decisions

Approval actions must be recorded.

---

## Procurement Officer

The procurement officer is responsible for managing the procurement process after an approved request reaches procurement.

Responsibilities include:

* Review approved requests
* Manage suppliers
* Create quotation requests
* Receive/manage supplier quotations
* Compare quotations
* Evaluate suppliers
* Select suppliers
* Generate purchase orders
* Monitor purchase orders
* Monitor deliveries
* Generate procurement reports

---

## Supplier

Suppliers should have a restricted supplier-facing experience.

They can:

* View their supplier profile
* Update permitted supplier information
* View quotation requests assigned to them
* Submit quotations
* View their quotation status
* View purchase orders relevant to them
* View relevant delivery information

Suppliers must never see another supplier's confidential quotation information.

---

# 8. CORE PROCUREMENT WORKFLOW

The central workflow should be:

```text
Procurement Request
        ↓
Request Submission
        ↓
Approval Review
        ↓
Approved / Rejected / Returned
        ↓
Procurement Processing
        ↓
Quotation Request
        ↓
Supplier Quotations
        ↓
Quotation Comparison
        ↓
Supplier Evaluation
        ↓
Supplier Selection
        ↓
Purchase Order
        ↓
Supplier Delivery
        ↓
Delivery Confirmation
        ↓
Procurement Completed
        ↓
Reports and Audit Records
```

The workflow must be reflected in the actual database and application logic.

Do not merely display this workflow visually.

It must actually work.

---

# 9. PROCUREMENT REQUEST MODULE

Create a functional procurement request module.

A requester should be able to create a request containing information such as:

* Request title
* Department
* Purpose
* Description
* Required date
* Priority where genuinely necessary
* Requested items
* Quantity
* Unit
* Estimated unit price
* Estimated total
* Specifications
* Supporting documents where appropriate

The system should automatically calculate totals where applicable.

Each request should have a meaningful status such as:

* Draft
* Submitted
* Under Review
* Approved
* Rejected
* Returned
* Processing
* Completed

Avoid excessive statuses.

The requester should be able to save a request as a draft before submitting it.

Once submitted, the appropriate approval workflow should begin.

---

# 10. APPROVAL MODULE

The approval system must be functional.

Approvers should be able to:

* Open a request
* Review complete request information
* Review requested items
* Review estimated costs
* Approve
* Reject
* Return for correction
* Add comments

The system must record:

* Approver
* Action
* Date
* Time
* Comment/reason
* Previous status
* New status

Users must not be able to bypass authorization through the frontend.

Authorization must also be enforced server-side.

---

# 11. SUPPLIER MANAGEMENT

Create a functional supplier management module.

Supplier information may include:

* Supplier name
* Contact person
* Email
* Phone
* Address
* Business/registration information where appropriate
* Category
* Status
* Previous procurement activity
* Performance information

Do not overload the supplier form with irrelevant fields.

Supplier records should be searchable and filterable.

Procurement officers should be able to view supplier history.

---

# 12. QUOTATION MANAGEMENT

Create a proper quotation workflow.

The procurement officer should be able to:

* Select an approved procurement request
* Invite appropriate suppliers
* Specify requested items
* Set quotation deadlines
* Receive quotations
* View submitted quotations
* Compare quotations
* Record quotation status

Suppliers should be able to submit:

* Quoted items
* Quantities
* Unit prices
* Total amount
* Delivery estimate
* Validity period
* Relevant notes
* Supporting quotation document where required

The system should calculate totals automatically.

---

# 13. QUOTATION COMPARISON

Provide a clear quotation comparison interface.

The comparison should allow procurement officers to evaluate suppliers based on meaningful information such as:

* Supplier
* Total quoted amount
* Unit prices
* Delivery time
* Quotation validity
* Relevant evaluation criteria

Do not automatically select the cheapest supplier unless the organization's procurement rule explicitly requires it.

The system should support informed decision-making rather than pretending that price is the only criterion.

---

# 14. SUPPLIER EVALUATION

Provide a structured supplier evaluation process.

Evaluation criteria can include:

* Price
* Quality
* Delivery
* Reliability
* Compliance
* Previous performance

The system should allow procurement officers to record scores or assessments where appropriate.

The evaluation must remain understandable.

Do not create an unnecessarily complicated mathematical scoring engine.

---

# 15. PURCHASE ORDER MODULE

After supplier selection, the procurement officer should be able to create a purchase order.

The purchase order should contain:

* Purchase order number
* Supplier
* Procurement request reference
* Order date
* Expected delivery date
* Items
* Quantities
* Unit prices
* Total amount
* Terms where applicable
* Status

Purchase order statuses should remain practical, for example:

* Draft
* Issued
* Acknowledged
* Partially Delivered
* Delivered
* Cancelled
* Completed

The system should generate a professional purchase order view that can be printed or exported where appropriate.

---

# 16. DELIVERY MONITORING

Create a delivery tracking module.

Procurement officers should be able to record:

* Expected delivery date
* Actual delivery date
* Items delivered
* Quantities delivered
* Outstanding quantities
* Delivery status
* Notes
* Supporting documentation where appropriate

Support partial deliveries.

For example:

```text
Ordered: 100 units
Delivered: 60 units
Outstanding: 40 units
```

The system should calculate outstanding quantities automatically.

Delivery status should update logically based on recorded information.

---

# 17. DASHBOARD

The dashboard must be dynamic.

Do not fill the dashboard with fake statistics.

Display information derived from the actual database.

Useful dashboard information may include:

* Total procurement requests
* Pending approvals
* Approved requests
* Requests currently in procurement
* Active purchase orders
* Pending deliveries
* Completed procurements
* Recent procurement activity

Where appropriate, provide a small number of meaningful charts showing trends such as:

* Procurement requests over time
* Procurement status distribution
* Procurement spending
* Supplier activity

Do not create charts simply to make the dashboard look impressive.

If there is insufficient real data, show an appropriate empty state instead of fake numbers.

---

# 18. REPORTING

Create a practical reporting section.

Reports may include:

* Procurement request report
* Procurement status report
* Supplier report
* Purchase order report
* Delivery report
* Procurement expenditure report
* Supplier performance report

Provide useful filtering such as:

* Date range
* Department
* Supplier
* Status
* Procurement category

Reports should be generated from real database records.

Do not create meaningless reports.

---

# 19. AUDIT TRAIL

The system must maintain an audit trail for important actions.

Examples:

* Request created
* Request submitted
* Request approved
* Request rejected
* Request returned
* Supplier created
* Quotation submitted
* Supplier selected
* Purchase order created
* Purchase order issued
* Delivery recorded

Record information such as:

* User
* Action
* Entity
* Entity ID
* Timestamp
* Relevant metadata

The audit log should be read-only for ordinary users.

---

# 20. NOTIFICATIONS

Implement useful system notifications.

Notifications should be generated for meaningful events such as:

* Procurement request submitted
* Request approved
* Request rejected
* Request returned
* Quotation request received
* Quotation submitted
* Supplier selected
* Purchase order issued
* Delivery updated

Do not spam users with unnecessary notifications.

The notification system should be connected to actual system events.

---

# 21. SEARCH AND FILTERING

Where records are likely to become numerous, provide useful search and filtering.

Examples:

* Procurement requests
* Suppliers
* Quotations
* Purchase orders
* Deliveries
* Audit records

Search should operate on real data.

Filters should meaningfully reduce the displayed records.

---

# 22. DATABASE DESIGN

Design a proper relational PostgreSQL database.

Possible core entities include:

```text
users
profiles
roles
departments
procurement_requests
procurement_request_items
approvals
suppliers
supplier_categories
quotation_requests
quotation_request_suppliers
quotations
quotation_items
supplier_evaluations
purchase_orders
purchase_order_items
deliveries
delivery_items
notifications
audit_logs
```

Do not blindly create every table listed above.

Analyze the relationships and only create entities that are genuinely necessary.

Ensure:

* Proper primary keys
* Foreign keys
* Appropriate indexes
* Referential integrity
* Timestamps
* Appropriate constraints
* Appropriate status values
* No unnecessary duplication

---

# 23. SECURITY

Security is an important part of the system.

Implement:

* Secure authentication
* Role-based authorization
* Server-side authorization checks
* Supabase Row Level Security
* Protected routes
* Input validation
* Proper error handling
* Secure database queries
* Protection against unauthorized record access
* Supplier data isolation
* Audit logging

Never rely solely on frontend route protection.

A user should not gain access to restricted information simply by manually entering a URL or modifying a request.

---

# 24. UI/UX DESIGN DIRECTION

This is extremely important.

The interface must look like a **real professional procurement management product**, not an AI-generated dashboard.

The design should feel as though it was created by a skilled product designer who understands enterprise software.

## Design characteristics

Use:

* Clean layouts
* Strong visual hierarchy
* Excellent typography
* Generous but controlled spacing
* Subtle borders
* Restrained shadows
* Professional tables
* Clear forms
* Well-designed navigation
* Consistent spacing
* Consistent component behavior
* Clear feedback states
* Strong accessibility

The visual style should be:

**Classic + Modern + Professional + Minimal + Functional**

---

# 25. AVOID AI-GENERATED UI VIBES

Absolutely do NOT create:

* Excessive gradients
* Neon colors
* Rainbow dashboards
* Excessive glassmorphism
* Huge decorative illustrations
* Random floating cards
* Excessive rounded containers
* Unnecessary animated elements
* Excessive icons
* Excessive badges
* Unnecessary status pills
* Fake metrics
* Decorative charts
* Giant headings everywhere
* Marketing-style dashboard sections
* Random motivational messages
* AI-generated-looking copy
* Unnecessary emojis

Do not make every section look like a floating card.

Do not use visual effects simply because they are popular.

---

# 26. COLOR SYSTEM

Use a restrained professional color palette.

The interface should primarily use:

* Neutral backgrounds
* White surfaces
* Dark text
* Muted secondary text
* One primary brand color
* Carefully chosen semantic colors for success, warning, and error

Do not use multiple unrelated accent colors.

Color should communicate meaning, not decoration.

For example:

* Green: successful/approved
* Amber: pending/warning
* Red: rejected/error
* Neutral: draft/inactive

Use these sparingly.

---

# 27. TYPOGRAPHY

Typography should feel professional and readable.

Use a modern sans-serif typeface with:

* Clear headings
* Strong but restrained hierarchy
* Comfortable body text
* Readable table text
* Appropriate form labels

Avoid unnecessarily huge typography.

The application is an enterprise management system, not a marketing landing page.

---

# 28. NAVIGATION

Create a clean application sidebar/navigation structure.

For example:

```text
Dashboard

Procurement
  Requests
  Approvals
  Quotations
  Purchase Orders
  Deliveries

Suppliers

Reports

Notifications

Audit Logs

Settings
```

Only display navigation items relevant to the authenticated user's role.

Do not show users pages they cannot access.

---

# 29. TABLE DESIGN

Tables are an important part of this application.

Design them professionally.

Tables should support:

* Clear column hierarchy
* Appropriate spacing
* Search
* Filtering
* Sorting where useful
* Pagination where necessary
* Row actions
* Empty states
* Loading states
* Error states

Do not place 15 unnecessary columns in one table.

Show the most important information first and provide a details page for additional information.

---

# 30. FORMS

Forms should be carefully designed.

Use:

* Clear labels
* Helpful descriptions where needed
* Logical grouping
* Validation
* Inline errors
* Required field indicators
* Appropriate input types
* Good spacing

Do not make forms unnecessarily long.

Use multi-step forms only when the amount of information genuinely requires them.

---

# 31. EMPTY STATES

Empty states should be useful and contextual.

For example:

If there are no procurement requests:

```text
No procurement requests yet.

Create your first procurement request to begin the procurement process.
```

Provide an appropriate action button where applicable.

Do not display fake records to make the interface appear populated.

---

# 32. LOADING AND ERROR STATES

Every data-driven page must handle:

* Loading
* Empty
* Error
* Success

Do not leave blank screens while data is loading.

Use appropriate skeletons or loading indicators.

Errors should be understandable to normal users.

Avoid exposing raw database errors to users.

---

# 33. RESPONSIVENESS

The application must work properly on:

* Desktop
* Laptop
* Tablet
* Mobile

However, do not sacrifice the desktop enterprise experience simply to make everything mobile-friendly.

Tables should have sensible responsive behavior.

Forms should adapt naturally to smaller screens.

Navigation should remain usable.

---

# 34. ACCESSIBILITY

Follow good accessibility practices.

Include:

* Proper semantic HTML
* Keyboard navigation
* Visible focus states
* Accessible labels
* Appropriate contrast
* Meaningful button labels
* Accessible form errors
* Screen-reader-friendly structure

Do not rely only on color to communicate status.

---

# 35. DYNAMIC DATA ONLY

This is a strict requirement.

Do not hardcode:

```text
847 Procurement Requests
₦12,450,000 Spending
92 Suppliers
37 Pending Orders
```

unless those values actually come from the database.

The dashboard and all major application pages must use real database data.

If there is no data, display a proper empty state.

---

# 36. NO UNNECESSARY FEATURES

Do not add unrelated functionality such as:

* Chat systems
* Social feeds
* Employee attendance
* Payroll
* Inventory management
* Customer relationship management
* Project management
* Marketing tools
* Cryptocurrency
* AI chatbot
* Gamification
* Unrelated analytics
* Unrelated financial management

The system is a **Procurement Management System**.

Stay within that scope.

---

# 37. NO UNNECESSARY STATIC CONTENT

Do not create static cards or sections merely to fill space.

For example, avoid meaningless sections such as:

```text
Welcome to the Future of Procurement
Empowering organizations with next-generation technology
```

inside the operational dashboard.

The application should focus on actual work.

Every page should answer:

**What does the user need to see or do here?**

---

# 38. PROFESSIONAL DETAILS

Pay attention to small details that make the system feel professionally designed:

* Consistent button sizes
* Consistent border radius
* Consistent spacing
* Proper hover states
* Proper focus states
* Clear destructive-action confirmations
* Good modal design
* Appropriate toast notifications
* Professional pagination
* Sensible table density
* Clear breadcrumbs where useful
* Meaningful page titles
* Contextual action buttons
* Confirmation dialogs for important actions

Do not overdesign these elements.

---

# 39. PROCUREMENT REQUEST DETAILS PAGE

When a user opens a procurement request, show a well-structured details page.

Include:

* Request information
* Department
* Requester
* Requested items
* Estimated total
* Current status
* Approval history
* Procurement progress
* Related quotations
* Related purchase order
* Delivery information
* Audit activity where authorized

This page should provide a clear understanding of the request's lifecycle.

---

# 40. PROCUREMENT LIFECYCLE VISUALIZATION

Where appropriate, provide a simple visual representation of procurement progress.

For example:

```text
Request
   ✓
Approval
   ✓
Quotation
   ✓
Supplier Selection
   ✓
Purchase Order
   ●
Delivery
   ○
Completed
```

Keep this subtle and useful.

Do not turn it into a decorative animation.

---

# 41. ERROR PREVENTION

Prevent invalid workflow actions.

For example:

* A rejected request cannot proceed to quotation.
* A request awaiting approval cannot generate a purchase order.
* A supplier cannot see another supplier's quotation.
* A purchase order cannot be created without an appropriate approved request.
* A delivery cannot exceed the outstanding quantity.
* A requester cannot approve their own request.
* Unauthorized users cannot modify restricted records.

These rules must be enforced on the backend.

---

# 42. DATA CONSISTENCY

Ensure that related information remains synchronized.

For example:

If:

```text
Ordered quantity = 100
Delivered quantity = 60
```

then:

```text
Outstanding quantity = 40
```

should be calculated correctly.

Similarly, procurement totals, quotation totals, purchase order totals, and delivery quantities should not depend on manually entered duplicate values where they can safely be derived.

---

# 43. AUDITABILITY

Important procurement decisions should be traceable.

A reviewer should be able to determine:

* Who submitted the request?
* Who approved it?
* When was it approved?
* Which suppliers were considered?
* Which quotations were received?
* Which supplier was selected?
* Who created the purchase order?
* When was the order issued?
* What was delivered?
* When was it delivered?

The system should make this information accessible to authorized users.

---

# 44. PERFORMANCE

Build the application with reasonable performance in mind.

Use:

* Server-side data fetching where appropriate
* Efficient database queries
* Pagination
* Proper indexing
* Minimal unnecessary client-side JavaScript
* Optimized components
* Proper loading states

Do not fetch an entire large table when only the first 20 records are needed.

---

# 45. CODE QUALITY

Write clean, maintainable code.

Use:

* Reusable components
* Clear naming
* Strong TypeScript typing
* Modular architecture
* Validation schemas
* Reusable database utilities
* Consistent error handling

Avoid:

* Giant components
* Repeated code
* Unnecessary abstractions
* `any` everywhere
* Hardcoded business logic scattered throughout components

---

# 46. IMPLEMENTATION APPROACH

Do not attempt to create the entire system as one enormous unstructured implementation.

Build incrementally.

Recommended order:

### Phase 1

Project setup and configuration

### Phase 2

Supabase integration

### Phase 3

Database schema

### Phase 4

Authentication

### Phase 5

Roles and permissions

### Phase 6

Application shell and navigation

### Phase 7

Procurement requests

### Phase 8

Approval workflow

### Phase 9

Supplier management

### Phase 10

Quotation management

### Phase 11

Supplier evaluation

### Phase 12

Purchase orders

### Phase 13

Delivery tracking

### Phase 14

Notifications

### Phase 15

Reports

### Phase 16

Audit logs

### Phase 17

Security review

### Phase 18

Responsive UI refinement

### Phase 19

Testing and bug fixing

---

# 47. TESTING REQUIREMENTS

Test the actual workflows.

At minimum verify:

### Authentication

* Registration
* Login
* Logout
* Session persistence
* Unauthorized access

### Procurement Requests

* Create
* Save draft
* Edit
* Submit
* View
* Track status

### Approval

* Approve
* Reject
* Return
* Prevent unauthorized approval

### Suppliers

* Create
* Edit
* Search
* View

### Quotations

* Create quotation request
* Submit quotation
* Compare quotations
* Prevent supplier data leakage

### Purchase Orders

* Create
* Issue
* View
* Track status

### Deliveries

* Record delivery
* Record partial delivery
* Calculate outstanding quantity
* Complete delivery

### Reports

* Filtering
* Accurate totals
* Correct date ranges

### Audit

* Important actions recorded correctly

---

# 48. FINAL QUALITY STANDARD

Before considering the project complete, ask:

1. Does the procurement workflow actually work from beginning to end?
2. Are all major records stored in the database?
3. Are role permissions enforced server-side?
4. Can users track procurement requests?
5. Can procurement officers manage suppliers?
6. Can suppliers submit quotations?
7. Can quotations be compared?
8. Can suppliers be evaluated?
9. Can purchase orders be generated?
10. Can deliveries be monitored?
11. Are procurement reports based on real data?
12. Is there an audit trail?
13. Are unauthorized actions prevented?
14. Does the application work on different screen sizes?
15. Are loading, error, and empty states handled?
16. Does the interface look professionally designed?
17. Is the interface restrained rather than visually noisy?
18. Is there any fake or unnecessary static data?
19. Is there any feature that does not directly support procurement management?
20. Does the final product feel like a genuine organizational software system rather than an AI-generated demo?

If the answer to any of these is no, fix it before declaring the project complete.

---

# 49. MOST IMPORTANT DESIGN PRINCIPLE

**Do not optimize for how much UI you can create. Optimize for how effectively the system solves the procurement management problem.**

A simple page with excellent information hierarchy, accurate data, clear actions, and a well-designed workflow is better than a visually complicated page filled with unnecessary elements.

The final application should feel:

**Professional.
Calm.
Trustworthy.
Efficient.
Modern.
Simple.
Purposeful.
Human-designed.**

It should look like software that an actual organization could use to manage procurement activities.

Do not make it look like a template.

Do not make it look like an AI-generated dashboard.

Do not add features merely to make the project appear larger.

Build the system around the actual procurement workflow and make every important feature functional.
