# GitHub Project Board Setup for Classes V2

**Purpose:** Track all 65 tasks for Classes V2 implementation using GitHub Projects

---

## 🎯 Project Setup

### 1. Create New Project

1. Go to repository → Projects → New Project
2. **Name:** "Classes V2 Implementation"
3. **Description:** "Redesigned class/program management system with container-first architecture"
4. **Template:** Board
5. **Visibility:** Private (until ready)

---

## 📊 Board Columns

Create the following columns (in order):

1. **📋 Backlog**
   - All tasks not yet started
   - Sorted by phase and task ID

2. **🔍 Ready (PRO)**
   - Tasks ready for Pro to design/architect
   - Pick next PRO task here

3. **🔍 Ready (MINI)**
   - Tasks ready for Mini to implement
   - Pick next MINI task here

4. **🏗️ In Progress**
   - Currently being worked on
   - Limit: 2-3 tasks max

5. **👀 Review**
   - Completed but needs testing/review
   - Include PR link

6. **✅ Done**
   - Completed and merged
   - Organized by phase

7. **🚫 Blocked**
   - Cannot proceed due to dependency or issue
   - Include blocker details

---

## 🏷️ Labels to Create

Create these labels in repository → Issues → Labels:

### By Model
- `model:pro` (Purple 🟣) - Requires Pro (design/strategy)
- `model:mini` (Green 🟢) - Requires Mini (implementation)

### By Priority
- `priority:critical` (Red) - Must complete for phase
- `priority:high` (Orange) - Important for phase
- `priority:medium` (Yellow) - Nice to have
- `priority:low` (Gray) - Optional enhancement

### By Phase
- `phase-1:foundation` (Blue)
- `phase-2:services` (Blue)
- `phase-3:ui-components` (Blue)
- `phase-4:integration` (Blue)
- `phase-5:assignments` (Blue)
- `phase-6:bookings` (Blue)
- `phase-7:mobile-pwa` (Blue)
- `phase-8:testing` (Blue)

### By Type
- `type:design` - Architecture/design task
- `type:implementation` - Coding task
- `type:testing` - Test writing
- `type:bug` - Bug fix
- `type:optimization` - Performance/refactor

### By Status
- `status:blocked` - Cannot proceed
- `status:needs-review` - Needs code review
- `status:needs-testing` - Needs manual testing

### Project Specific
- `v2-implementation` - All V2 tasks
- `breaking-change` - Changes API/schema
- `documentation` - Docs update needed

---

## 📝 Issue Template Usage

For each task in V2_IMPLEMENTATION_TASKS.md:

1. Create new issue using template
2. Fill in all sections from task markdown
3. Apply appropriate labels
4. Add to project board
5. Link dependencies (if any)
6. Add to milestone (if using milestones)

---

## 🔄 Workflow

### Starting a Task

1. **Pick from Ready column** (PRO or MINI)
2. **Move to In Progress**
3. **Assign to yourself**
4. **Update issue with:**
   - Start date
   - Any blockers discovered
   - Link to branch

### Completing a Task

1. **Create PR** with:
   - Link to issue (`Fixes #123`)
   - Screenshots (if UI)
   - Testing notes
2. **Move to Review column**
3. **Update issue with:**
   - PR link
   - Completion notes
   - Any follow-up needed

### After Merge

1. **Move to Done column**
2. **Close issue** (auto-closes via PR)
3. **Update dependent tasks:**
   - Check off dependency
   - Move to Ready if unblocked

---

## 🎯 Milestones (Optional)

Create milestones for each phase:

1. **Phase 1: Foundation** (Week 1)
   - Due: [Date]
   - Tasks: 1.1 - 1.12

2. **Phase 2: Services** (Week 2)
   - Due: [Date]
   - Tasks: 2.1 - 2.10

3. **Phase 3: UI Components** (Week 3-4)
   - Due: [Date]
   - Tasks: 3.1 - 3.10

4. **Phase 4: Integration** (Week 5)
   - Due: [Date]
   - Tasks: 4.1 - 4.7

5. **Phase 5: Assignments** (Week 6)
   - Due: [Date]
   - Tasks: 5.1 - 5.7

6. **Phase 6: Bookings** (Week 7)
   - Due: [Date]
   - Tasks: 6.1 - 6.6

7. **Phase 7: Mobile/PWA** (Week 8)
   - Due: [Date]
   - Tasks: 7.1 - 7.7

8. **Phase 8: Testing** (Week 9)
   - Due: [Date]
   - Tasks: 8.1 - 8.6

---

## 📊 Views to Create

### View 1: By Model (Default)
- **Filter:** None
- **Group by:** Label (`model:pro`, `model:mini`)
- **Sort by:** Priority, then Phase

### View 2: By Phase
- **Filter:** None
- **Group by:** Label (phase labels)
- **Sort by:** Task ID

### View 3: By Priority
- **Filter:** Status not Done
- **Group by:** Priority
- **Sort by:** Phase

### View 4: Current Sprint
- **Filter:** Milestone = Current week
- **Group by:** Status column
- **Sort by:** Priority

### View 5: Blocked Items
- **Filter:** Label = `status:blocked`
- **Group by:** None
- **Sort by:** Created date

---

## 🔢 Bulk Issue Creation Script

Use GitHub CLI to create all 65 issues at once:

```bash
# Install GitHub CLI if needed
# https://cli.github.com/

# Login
gh auth login

# Create issues from template (customize this script)
# For each task in V2_IMPLEMENTATION_TASKS.md:

gh issue create \
  --title "[Phase 1.1] Project Structure Planning" \
  --body-file .github/ISSUE_TEMPLATE/task-1-1.md \
  --label "v2-implementation,model:pro,priority:critical,phase-1:foundation,type:design" \
  --project "Classes V2 Implementation"

# Repeat for all 65 tasks...
```

**Or use automation script:**

```python
# create_v2_issues.py
# Script to parse V2_IMPLEMENTATION_TASKS.md and create GitHub issues
# (Would need to be implemented)
```

---

## 📈 Progress Tracking

### Daily Standup Checklist
- [ ] Review In Progress (should be 2-3 max)
- [ ] Check Blocked column (unblock if possible)
- [ ] Move Ready tasks to In Progress
- [ ] Update estimates on In Progress tasks

### Weekly Review Checklist
- [ ] Review Done column (celebrate! 🎉)
- [ ] Update phase progress in README
- [ ] Identify blockers for next week
- [ ] Adjust priorities if needed
- [ ] Update milestone dates

### Phase Completion Checklist
- [ ] All phase tasks in Done
- [ ] Phase documentation updated
- [ ] Demo prepared (if applicable)
- [ ] Retrospective notes added
- [ ] Next phase tasks moved to Ready

---

## 🎨 Automation Ideas

### GitHub Actions

Create workflow to:
1. **Auto-label PRs** based on files changed
2. **Move issues** to Review when PR created
3. **Close issues** when PR merged
4. **Update project board** automatically
5. **Send notifications** for blocked tasks

Example workflow:

```yaml
# .github/workflows/v2-project-automation.yml
name: V2 Project Automation

on:
  pull_request:
    types: [opened, closed]
  issues:
    types: [labeled]

jobs:
  auto-move:
    runs-on: ubuntu-latest
    steps:
      - name: Move to Review on PR
        if: github.event.action == 'opened'
        # ... automation logic

      - name: Move to Done on merge
        if: github.event.pull_request.merged == true
        # ... automation logic
```

---

## 📚 Resources

- [GitHub Projects Documentation](https://docs.github.com/en/issues/planning-and-tracking-with-projects)
- [GitHub CLI Manual](https://cli.github.com/manual/)
- [Automation with GitHub Actions](https://docs.github.com/en/actions)

---

## ✅ Setup Checklist

- [ ] Create GitHub Project "Classes V2 Implementation"
- [ ] Create all 7 columns
- [ ] Create all labels (model, priority, phase, type, status)
- [ ] Add issue template to repository
- [ ] Create milestones for each phase
- [ ] Create custom views
- [ ] Bulk create issues (or create as you go)
- [ ] Link project to repository
- [ ] Add project link to README
- [ ] Setup automation (optional)
- [ ] Brief team on workflow

---

**Setup Time:** ~1 hour  
**Maintenance Time:** ~15 min/day  
**Value:** High - Clear progress visibility, prevents work duplication
