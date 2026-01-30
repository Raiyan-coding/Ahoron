// script.js - প্রথম লাইনগুলোতে যোগ করুন
const subjects = appConfig.subjects;           // ["Physics", "Higher Math", ...]
const subjectMaxMarks = appConfig.subjectMaxMarks; // [25, 25, 25, 25, 30, 30, ...]
const TOTAL_MARKS = appConfig.totalMarks;      // 275

class MCQTracker {
    constructor() {
        this.storageKey = 'mcqMission2026';
        this.currentSetId = null;
        this.initialize();
    }

    initialize() {
        this.loadData();
        this.renderSchedule();
        this.setupEventListeners();
        this.updateStats();
        this.setTodayTask();
    }

    loadData() {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
            this.data = JSON.parse(saved);
        } else {
            // Initialize with empty data
            this.data = scheduleData.map(set => ({
                ...set,
                attended: false,
                marks: Array(10).fill(0),
                total: 0,
                percentage: 0
            }));
            this.saveData();
        }
    }

    saveData() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    }

    renderSchedule() {
        const tbody = document.getElementById('schedule-body');
        tbody.innerHTML = '';
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        this.data.forEach(set => {
            const row = document.createElement('tr');
            const setDate = new Date(set.date);
            
            // Add class based on date
            if (set.id === this.getTodaySetId()) {
                row.classList.add('today-row');
            } else if (set.attended) {
                row.classList.add('completed-row');
            }
            
            // Apply blur for future dates (except April)
            if (setDate > today) {
                const month = setDate.getMonth() + 1; // January is 0
                if (month !== 4) { // April is month 4
                    row.classList.add('blurred');
                }
            }
            
            // Format date
            const dateStr = setDate.toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            
            row.innerHTML = `
                <td>${dateStr}</td>
                <td>${this.getDayName(setDate.getDay())}</td>
                <td><strong>${set.set_name}</strong><br><small class="text-muted">${set.type}</small></td>
                <td><span class="badge ${this.getTypeBadge(set.type)}">${set.type}</span></td>
                <td>
                    <div class="form-check">
                        <input class="form-check-input attendance-checkbox" type="checkbox" 
                               data-id="${set.id}" ${set.attended ? 'checked' : ''}>
                    </div>
                </td>
                <td>
                    <span class="score-display" data-id="${set.id}">
                        ${set.attended ? `${set.total}/${TOTAL_MARKS} (${set.percentage}%)` : 'Not taken'}
                    </span>
                    ${set.attended ? `<div class="progress"><div class="progress-bar" style="width: ${set.percentage}%"></div></div>` : ''}
                </td>
                <td>
                    <button class="btn btn-sm btn-primary enter-marks-btn" data-id="${set.id}">
                        <i class="bi bi-pencil"></i> Enter Marks
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
        
        this.attachRowEventListeners();
    }

    getTypeBadge(type) {
        switch(type) {
            case 'Board': return 'bg-primary';
            case 'School': return 'bg-success';
            case 'Cadet': return 'bg-warning';
            default: return 'bg-secondary';
        }
    }

    getDayName(dayIndex) {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return days[dayIndex];
    }

    getTodaySetId() {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const todaySet = this.data.find(set => set.date === todayStr);
        return todaySet ? todaySet.id : null;
    }

    attachRowEventListeners() {
        // Attendance checkboxes
        document.querySelectorAll('.attendance-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const id = parseInt(e.target.dataset.id);
                this.toggleAttendance(id, e.target.checked);
            });
        });

        // Score display clicks
        document.querySelectorAll('.score-display').forEach(span => {
            span.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                this.showMarksModal(id);
            });
        });

        // Enter marks buttons
        document.querySelectorAll('.enter-marks-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.closest('button').dataset.id);
                this.showMarksModal(id);
            });
        });
    }

    setupEventListeners() {
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                this.filterSchedule(filter);
                
                // Update active state
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // Save marks button in modal
        document.getElementById('save-marks').addEventListener('click', () => {
            this.saveCurrentMarks();
        });

        // Export data
        document.getElementById('export-data').addEventListener('click', () => {
            this.exportData();
        });

        // Import data
        document.getElementById('import-file').addEventListener('change', (e) => {
            this.importData(e.target.files[0]);
        });
    }

    toggleAttendance(id, attended) {
        const set = this.data.find(s => s.id === id);
        if (set) {
            set.attended = attended;
            if (!attended) {
                set.marks = Array(10).fill(0);
                set.total = 0;
                set.percentage = 0;
            }
            this.saveData();
            this.renderSchedule();
            this.updateStats();
        }
    }

    showMarksModal(id) {
        this.currentSetId = id;
        const set = this.data.find(s => s.id === id);
        
        if (!set) return;
        
        // Update modal title
        document.getElementById('modal-set-info').innerHTML = `
            <h6>${set.set_name}</h6>
            <p>Date: ${new Date(set.date).toLocaleDateString()} | Type: ${set.type}</p>
        `;
        
        // Generate marks inputs
        const marksContainer = document.getElementById('marks-inputs');
        marksContainer.innerHTML = '';
        
        subjects.forEach((subject, index) => {
            const col = document.createElement('div');
            col.className = 'col-md-6 mb-3';
            col.innerHTML = `
                <div class="subject-mark">
                    <label class="form-label">${subject} (${subjectMaxMarks[index]} marks)</label>
                    <input type="number" class="form-control subject-mark-input" 
                           data-index="${index}" min="0" max="${subjectMaxMarks[index]}" 
                           value="${set.marks[index] || 0}">
                    <div class="form-text">Out of ${subjectMaxMarks[index]}</div>
                </div>
            `;
            marksContainer.appendChild(col);
        });
        
        // Update total
        this.updateTotalDisplay();
        
        // Add input listeners for real-time update
        document.querySelectorAll('.subject-mark-input').forEach(input => {
            input.addEventListener('input', () => this.updateTotalDisplay());
        });
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('marksModal'));
        modal.show();
    }

    updateTotalDisplay() {
        let total = 0;
        document.querySelectorAll('.subject-mark-input').forEach(input => {
            total += parseInt(input.value) || 0;
        });
        document.getElementById('total-marks-display').textContent = total;
    }

    saveCurrentMarks() {
        if (!this.currentSetId) return;
        
        const set = this.data.find(s => s.id === this.currentSetId);
        if (!set) return;
        
        const marks = [];
        let total = 0;
        
        document.querySelectorAll('.subject-mark-input').forEach(input => {
            const mark = parseInt(input.value) || 0;
            marks.push(mark);
            total += mark;
        });
        
        set.marks = marks;
        set.total = total;
        set.percentage = Math.round((total / TOTAL_MARKS) * 100);
        set.attended = true;
        
        this.saveData();
        this.renderSchedule();
        this.updateStats();
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('marksModal'));
        modal.hide();
    }

    updateStats() {
        const completed = this.data.filter(s => s.attended).length;
        const totalSets = this.data.length;
        const remaining = totalSets - completed;
        
        // Calculate average score
        const attendedSets = this.data.filter(s => s.attended);
        const avgPercentage = attendedSets.length > 0 
            ? Math.round(attendedSets.reduce((sum, s) => sum + s.percentage, 0) / attendedSets.length)
            : 0;
        
        // Update display
        document.getElementById('completed-count').textContent = completed;
        document.getElementById('remaining-count').textContent = remaining;
        document.getElementById('avg-score').textContent = `${avgPercentage}%`;
        document.getElementById('days-completed').textContent = completed;
        document.getElementById('success-rate').textContent = `${avgPercentage}%`;
        
        // Find next exam
        const today = new Date();
        const nextExam = this.data.find(s => new Date(s.date) >= today && !s.attended);
        document.getElementById('next-exam').textContent = nextExam 
            ? `${nextExam.set_name} (${new Date(nextExam.date).toLocaleDateString()})`
            : 'No upcoming exams';
    }

    setTodayTask() {
        const todaySet = this.data.find(s => s.id === this.getTodaySetId());
        const todayTask = document.getElementById('today-task');
        
        if (todaySet) {
            todayTask.innerHTML = `
                <strong>${todaySet.set_name}</strong><br>
                <small>${todaySet.type} | ${subjects.length} subjects (${TOTAL_MARKS} marks)</small>
                ${todaySet.attended ? `<br><span class="badge bg-success">Completed</span>` : ''}
            `;
        } else {
            todayTask.textContent = 'No exam scheduled for today';
        }
    }

    filterSchedule(filter) {
        const rows = document.querySelectorAll('#schedule-body tr');
        
        rows.forEach(row => {
            switch(filter) {
                case 'completed':
                    row.style.display = row.classList.contains('completed-row') ? '' : 'none';
                    break;
                case 'pending':
                    row.style.display = row.classList.contains('completed-row') ? 'none' : '';
                    break;
                case 'today':
                    row.style.display = row.classList.contains('today-row') ? '' : 'none';
                    break;
                default:
                    row.style.display = '';
            }
        });
    }

    exportData() {
        const dataStr = JSON.stringify(this.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `mcq-mission-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    importData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                this.data = importedData;
                this.saveData();
                this.renderSchedule();
                this.updateStats();
                alert('Data imported successfully!');
            } catch (error) {
                alert('Error importing data. Please check the file format.');
            }
        };
        reader.readAsText(file);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.mcqTracker = new MCQTracker();
});