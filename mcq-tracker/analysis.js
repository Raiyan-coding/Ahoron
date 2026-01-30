// analysis.js - প্রথম লাইনগুলোতে যোগ করুন
const subjects = appConfig.subjects;           // config থেকে subject list
const subjectMaxMarks = appConfig.subjectMaxMarks; // config থেকে max marks

class MCQAnalysis {
    constructor() {
        this.charts = {};
        this.initialize();
    }

    initialize() {
        this.loadData();
        this.updateQuickStats();
        this.renderSubjectDetails();
        this.initializeCharts();
        this.setupEventListeners();
    }

    loadData() {
        const saved = localStorage.getItem('mcqMission2026');
        if (saved) {
            this.data = JSON.parse(saved);
        } else {
            this.data = [];
        }
    }

    updateQuickStats() {
        const attended = this.data.filter(s => s.attended);
        const total = this.data.length;
        
        // Attendance
        const attendancePercentage = total > 0 ? Math.round((attended.length / total) * 100) : 0;
        document.getElementById('attendance-percentage').textContent = `${attendancePercentage}%`;
        document.getElementById('attendance-detail').textContent = `${attended.length}/${total} exams`;
        
        // Best and worst scores
        if (attended.length > 0) {
            const best = attended.reduce((max, set) => set.percentage > max.percentage ? set : max);
            const worst = attended.reduce((min, set) => set.percentage < min.percentage ? set : min);
            
            document.getElementById('best-score').textContent = `${best.percentage}%`;
            document.getElementById('best-set').textContent = best.set_name;
            document.getElementById('worst-score').textContent = `${worst.percentage}%`;
            document.getElementById('worst-set').textContent = worst.set_name;
            
            // Overall average
            const avg = Math.round(attended.reduce((sum, set) => sum + set.percentage, 0) / attended.length);
            document.getElementById('overall-average').textContent = `${avg}%`;
        }
        
        // Quick stats
        document.getElementById('quick-stats').innerHTML = `
            <div>Exams taken: <strong>${attended.length}</strong></div>
            <div>Remaining: <strong>${total - attended.length}</strong></div>
            <div>Completion: <strong>${attendancePercentage}%</strong></div>
        `;
    }

    renderSubjectDetails() {
        const tbody = document.getElementById('subject-details');
        tbody.innerHTML = '';
        
        const subjectAverages = this.calculateSubjectAverages();
        
        subjects.forEach((subject, index) => {
            const avg = subjectAverages[index] || 0;
            const best = this.getBestScoreForSubject(index);
            const worst = this.getWorstScoreForSubject(index);
            const trend = this.getTrendForSubject(index);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${subject}</strong></td>
                <td>
                    <div class="progress" style="height: 20px;">
                        <div class="progress-bar" style="width: ${avg}%">${avg}%</div>
                    </div>
                </td>
                <td><span class="badge bg-success">${best}%</span></td>
                <td><span class="badge bg-danger">${worst}%</span></td>
                <td>
                    ${trend === 'up' ? '<i class="bi bi-arrow-up text-success"></i> Improving' : 
                      trend === 'down' ? '<i class="bi bi-arrow-down text-danger"></i> Declining' : 
                      '<i class="bi bi-dash text-secondary"></i> Stable'}
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    calculateSubjectAverages() {
        const attended = this.data.filter(s => s.attended);
        if (attended.length === 0) return Array(10).fill(0);
        
        const subjectTotals = Array(10).fill(0);
        const subjectCounts = Array(10).fill(0);
        
        attended.forEach(set => {
            set.marks.forEach((mark, index) => {
                subjectTotals[index] += (mark / subjectMaxMarks[index]) * 100; // Convert to percentage
                subjectCounts[index]++;
            });
        });
        
        return subjectTotals.map((total, index) => 
            Math.round(total / subjectCounts[index])
        );
    }

    getBestScoreForSubject(subjectIndex) {
        const attended = this.data.filter(s => s.attended && s.marks[subjectIndex] !== undefined);
        if (attended.length === 0) return 0;
        
        const best = attended.reduce((max, set) => {
            const percentage = (set.marks[subjectIndex] / subjectMaxMarks[subjectIndex]) * 100;
            return percentage > max ? percentage : max;
        }, 0);
        
        return Math.round(best);
    }

    getWorstScoreForSubject(subjectIndex) {
        const attended = this.data.filter(s => s.attended && s.marks[subjectIndex] !== undefined);
        if (attended.length === 0) return 0;
        
        const worst = attended.reduce((min, set) => {
            const percentage = (set.marks[subjectIndex] / subjectMaxMarks[subjectIndex]) * 100;
            return percentage < min ? percentage : min;
        }, 100);
        
        return Math.round(worst);
    }

getTrendForSubject(subjectIndex) {
    // Simple trend calculation based on last 3 exams
    const attended = this.data.filter(s => s.attended && s.marks[subjectIndex] !== undefined);
    if (attended.length < 3) return 'stable';
    
    const recent = attended.slice(-3);
    const scores = recent.map(set => (set.marks[subjectIndex] / subjectMaxMarks[subjectIndex]) * 100); // CORRECT
    
    if (scores[2] > scores[0] + 5) return 'up';
    if (scores[2] < scores[0] - 5) return 'down';
    return 'stable';
}

    initializeCharts() {
        this.createSubjectChart();
        this.createProgressChart();
        this.createTypeChart();
        this.createMonthlyChart();
        this.updateStrengthsList();
    }

    createSubjectChart() {
        const ctx = document.getElementById('subjectChart').getContext('2d');
        const subjectAverages = this.calculateSubjectAverages();
        
        this.charts.subject = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: subjects,
                datasets: [{
                    label: 'Average Score %',
                    data: subjectAverages,
                    backgroundColor: [
                        '#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0', '#118AB2',
                        '#073B4C', '#EF476F', '#7209B7', '#3A86FF', '#8338EC'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }

    createProgressChart() {
        const ctx = document.getElementById('progressChart').getContext('2d');
        const attended = this.data.filter(s => s.attended);
        
        const labels = attended.map(s => new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        const scores = attended.map(s => s.percentage);
        
        this.charts.progress = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Score %',
                    data: scores,
                    borderColor: '#4361ee',
                    backgroundColor: 'rgba(67, 97, 238, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }

    createTypeChart() {
        const ctx = document.getElementById('typeChart').getContext('2d');
        const types = ['Board', 'School', 'Cadet'];
        const typeData = {};
        
        types.forEach(type => {
            const typeSets = this.data.filter(s => s.attended && s.type === type);
            if (typeSets.length > 0) {
                const avg = typeSets.reduce((sum, set) => sum + set.percentage, 0) / typeSets.length;
                typeData[type] = Math.round(avg);
            } else {
                typeData[type] = 0;
            }
        });
        
        this.charts.type = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: types,
                datasets: [{
                    data: types.map(t => typeData[t]),
                    backgroundColor: ['#4361ee', '#4cc9f0', '#f72585']
                }]
            }
        });
    }

    createMonthlyChart() {
        const ctx = document.getElementById('monthlyChart').getContext('2d');
        const months = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
        const monthlyData = {};
        
        months.forEach(month => {
            const monthSets = this.data.filter(s => {
                if (!s.attended) return false;
                const setMonth = new Date(s.date).toLocaleDateString('en-US', { month: 'short' });
                return setMonth === month;
            });
            
            if (monthSets.length > 0) {
                const avg = monthSets.reduce((sum, set) => sum + set.percentage, 0) / monthSets.length;
                monthlyData[month] = Math.round(avg);
            } else {
                monthlyData[month] = 0;
            }
        });
        
        this.charts.monthly = new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [{
                    label: 'Monthly Average %',
                    data: months.map(m => monthlyData[m]),
                    borderColor: '#06D6A0',
                    backgroundColor: 'rgba(6, 214, 160, 0.1)',
                    fill: true
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }

    updateStrengthsList() {
        const strengthsList = document.getElementById('strengths-list');
        const subjectAverages = this.calculateSubjectAverages();
        
        if (subjectAverages.every(avg => avg === 0)) {
            strengthsList.innerHTML = '<p class="text-muted">Complete some exams to see analysis</p>';
            return;
        }
        
        // Find top 3 and bottom 3 subjects
        const subjectWithAverages = subjects.map((subject, index) => ({
            subject,
            average: subjectAverages[index]
        }));
        
        subjectWithAverages.sort((a, b) => b.average - a.average);
        
        const top3 = subjectWithAverages.slice(0, 3);
        const bottom3 = subjectWithAverages.slice(-3).reverse();
        
        let html = '<div class="mb-3">';
        html += '<h6>👍 Strongest Subjects:</h6>';
        top3.forEach(item => {
            html += `<div class="d-flex justify-content-between mb-1">
                        <span>${item.subject}</span>
                        <span class="badge bg-success">${item.average}%</span>
                     </div>`;
        });
        
        html += '</div><div>';
        html += '<h6>👎 Needs Improvement:</h6>';
        bottom3.forEach(item => {
            html += `<div class="d-flex justify-content-between mb-1">
                        <span>${item.subject}</span>
                        <span class="badge bg-danger">${item.average}%</span>
                     </div>`;
        });
        html += '</div>';
        
        strengthsList.innerHTML = html;
    }

    setupEventListeners() {
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                this.applyFilter(filter);
                
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // Export analysis
        document.getElementById('export-analysis').addEventListener('click', () => {
            this.exportAnalysisReport();
        });
    }

    applyFilter(filter) {
        // This function can be extended to filter charts based on criteria
        console.log(`Applied filter: ${filter}`);
        // For now, just update charts with current data
        this.updateCharts();
    }

    updateCharts() {
        Object.values(this.charts).forEach(chart => chart.destroy());
        this.initializeCharts();
        this.updateQuickStats();
        this.renderSubjectDetails();
    }

    exportAnalysisReport() {
        const analysisData = {
            summary: {
                totalExams: this.data.length,
                completedExams: this.data.filter(s => s.attended).length,
                attendanceRate: Math.round((this.data.filter(s => s.attended).length / this.data.length) * 100),
                overallAverage: this.calculateOverallAverage()
            },
            subjectAverages: this.calculateSubjectAverages().map((avg, index) => ({
                subject: subjects[index],
                average: avg
            })),
            examHistory: this.data.filter(s => s.attended).map(set => ({
                date: set.date,
                set: set.set_name,
                type: set.type,
                score: set.percentage,
                total: set.total
            })),
            generated: new Date().toISOString()
        };

        const dataStr = JSON.stringify(analysisData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `mcq-analysis-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    calculateOverallAverage() {
        const attended = this.data.filter(s => s.attended);
        if (attended.length === 0) return 0;
        
        return Math.round(attended.reduce((sum, set) => sum + set.percentage, 0) / attended.length);
    }
}

// Initialize analysis when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.mcqAnalysis = new MCQAnalysis();
});