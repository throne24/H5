/**
 * 极简记账 App - v3.2 (动态预算 + 修复左滑删除 + PWA)
 */

// ==================== 配置 ====================
const CATEGORIES = [
    { name: '餐饮', icon: '🍜' },
    { name: '交通', icon: '🚌' },
    { name: '购物', icon: '🛒' },
    { name: '娱乐', icon: '🎮' },
    { name: '居住', icon: '🏠' },
    { name: '医疗', icon: '💊' },
    { name: '教育', icon: '📚' },
    { name: '其他', icon: '📌' }
];

// ==================== 主应用类 ====================
class TrackerApp {
    constructor() {
        this.state = {
            isModalOpen: false,
            selectedCategory: CATEGORIES[0],
            transactions: [],
            budgetLimit: 3000,
            // 手势状态
            touchStartX: 0,
            touchCurrentX: 0,
            activeCard: null,
            isSwiping: false
        };

        this.dom = {};
        this.MAX_SWIPE = 80;
        this.DELETE_THRESHOLD = 40;
    }

    // ==================== 初始化 ====================
    init() {
        console.log('📱 记账应用 v3.2 初始化完成');
        this.cacheDom();
        this.renderCategories();
        this.bindEvents();
        this.bindTouchEvents();
        this.loadFromStorage();
        this.bindBudgetEditEvent();
        this.renderList();
    }

    cacheDom() {
        this.dom = {
            transactionList: document.getElementById('transaction-list'),
            modalOverlay: document.getElementById('modal-overlay'),
            actionSheet: document.getElementById('action-sheet'),
            btnAdd: document.getElementById('btn-add'),
            btnCancel: document.getElementById('btn-cancel'),
            btnSave: document.getElementById('btn-save'),
            inputAmount: document.getElementById('input-amount'),
            inputNote: document.getElementById('input-note'),
            categoryGrid: document.getElementById('category-grid'),
            progressRing: document.getElementById('progress-ring'),
            progressPercent: document.getElementById('progress-percent'),
            budgetText: document.getElementById('budget-text')
        };
    }

    // ==================== 事件绑定 ====================
    bindEvents() {
        this.dom.btnAdd.addEventListener('click', () => this.openModal());
        this.dom.btnCancel.addEventListener('click', () => this.closeModal());
        this.dom.modalOverlay.addEventListener('click', (e) => {
            if (e.target === this.dom.modalOverlay) this.closeModal();
        });
        this.dom.btnSave.addEventListener('click', () => this.saveTransaction());

        this.dom.inputAmount.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9.]/g, '');
            const parts = e.target.value.split('.');
            if (parts.length > 2) {
                e.target.value = parts[0] + '.' + parts.slice(1).join('');
            }
        });
    }

    // 点击预算文字修改预算
    bindBudgetEditEvent() {
        this.dom.budgetText.addEventListener('click', () => {
            const newBudget = prompt('请输入每月预算金额', this.state.budgetLimit);
            if (newBudget === null) return;

            const value = parseFloat(newBudget);
            if (isNaN(value) || value <= 0) {
                alert('请输入有效的正数金额');
                return;
            }

            this.state.budgetLimit = value;
            this.saveToStorage();
            this.updateProgressRing();
            console.log(`💰 预算已更新为: ¥${value}`);
        });
    }

    // ==================== 分类渲染 ====================
    renderCategories() {
        this.dom.categoryGrid.innerHTML = CATEGORIES.map((cat, index) => `
            <div class="category-item ${index === 0 ? 'selected' : ''}" data-index="${index}">
                <span class="category-icon">${cat.icon}</span>
                <span class="category-name">${cat.name}</span>
            </div>
        `).join('');

        this.dom.categoryGrid.addEventListener('click', (e) => {
            const item = e.target.closest('.category-item');
            if (!item) return;

            this.dom.categoryGrid.querySelectorAll('.category-item').forEach(el => el.classList.remove('selected'));
            item.classList.add('selected');

            const index = parseInt(item.dataset.index);
            this.state.selectedCategory = CATEGORIES[index];
        });
    }

    // ==================== 弹窗控制 ====================
    openModal() {
        this.state.isModalOpen = true;
        this.dom.modalOverlay.classList.add('active');
        this.dom.actionSheet.classList.add('active');
        setTimeout(() => this.dom.inputAmount.focus(), 300);
    }

    closeModal() {
        this.state.isModalOpen = false;
        this.dom.modalOverlay.classList.remove('active');
        this.dom.actionSheet.classList.remove('active');
        this.dom.inputAmount.value = '';
        this.dom.inputNote.value = '';
        this.state.selectedCategory = CATEGORIES[0];
        this.dom.categoryGrid.querySelectorAll('.category-item').forEach((el, i) => {
            el.classList.toggle('selected', i === 0);
        });
    }

    // ==================== 保存账单 ====================
    saveTransaction() {
        const amount = parseFloat(this.dom.inputAmount.value);
        if (isNaN(amount) || amount <= 0) {
            alert('请输入有效金额');
            this.dom.inputAmount.focus();
            return;
        }

        const transaction = {
            id: Date.now(),
            amount: amount,
            category: this.state.selectedCategory,
            note: this.dom.inputNote.value.trim(),
            date: new Date().toISOString()
        };

        this.state.transactions.unshift(transaction);
        this.saveToStorage();
        this.renderList();
        this.closeModal();
        console.log('✅ 账单已保存:', transaction);
    }

    // ==================== 列表渲染 ====================
    renderList() {
        if (this.state.transactions.length === 0) {
            this.dom.transactionList.innerHTML = '<div class="empty-state">还没有账单，点击下方 + 记一笔吧</div>';
        } else {
            this.dom.transactionList.innerHTML = this.state.transactions.map(t => {
                const date = new Date(t.date);
                const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
                return `
                    <div class="transaction-card-wrapper" data-id="${t.id}">
                        <div class="delete-btn-bg">删除</div>
                        <div class="transaction-card">
                            <div style="display:flex;align-items:center;gap:12px;">
                                <span style="font-size:28px;">${t.category.icon}</span>
                                <div>
                                    <div style="font-weight:600;font-size:15px;">${t.category.name}</div>
                                    <div style="font-size:12px;color:var(--text-sub);margin-top:2px;">${dateStr}${t.note ? ' · ' + t.note : ''}</div>
                                </div>
                            </div>
                            <div style="font-weight:bold;font-size:16px;color:var(--danger-color);">-¥${t.amount.toFixed(2)}</div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        this.updateProgressRing();
    }

    // ==================== 环形进度图 ====================
    updateProgressRing() {
        const totalExpense = this.state.transactions.reduce((sum, t) => sum + t.amount, 0);
        let percent = (totalExpense / this.state.budgetLimit) * 100;
        percent = Math.min(percent, 100);

        let color = '#4A90E2';
        if (percent > 80) color = '#FF9800';
        if (percent >= 100) color = '#FF4D4F';

        this.dom.progressRing.style.background = `conic-gradient(${color} ${percent}%, #eee ${percent}% 100%)`;
        this.dom.progressPercent.textContent = `${Math.round(percent)}%`;
        this.dom.progressPercent.style.color = color;
        this.dom.budgetText.textContent = `预算: ¥${this.state.budgetLimit} | 已用: ¥${totalExpense.toFixed(2)}`;
    }

    // ==================== Touch 手势删除（v3.3 稳健版）====================
    bindTouchEvents() {
        const list = this.dom.transactionList;

        // 判断某个卡片是否正在删除中
        const isCardDeleting = (card) => {
            const wrapper = card.closest('.transaction-card-wrapper');
            return wrapper && wrapper.classList.contains('deleting');
        };

        list.addEventListener('touchstart', (e) => {
            const wrapper = e.target.closest('.transaction-card-wrapper');
            if (!wrapper) return;

            // 点击删除按钮本身不触发滑动
            if (e.target.closest('.delete-btn-bg')) return;

            const card = wrapper.querySelector('.transaction-card');

            // 正在删除的卡片不再响应滑动
            if (isCardDeleting(card)) return;

            // 复位其他展开的卡片
            if (this.state.activeCard && this.state.activeCard !== card) {
                this.resetCard(this.state.activeCard);
            }

            this.state.activeCard = card;
            this.state.touchStartX = e.touches[0].clientX;
            this.state.touchCurrentX = this.state.touchStartX;
            this.state.isSwiping = false;
            card.classList.remove('animating');
        }, { passive: true });

        list.addEventListener('touchmove', (e) => {
            if (!this.state.activeCard) return;
            if (isCardDeleting(this.state.activeCard)) return;

            this.state.touchCurrentX = e.touches[0].clientX;
            const deltaX = this.state.touchCurrentX - this.state.touchStartX;

            if (deltaX < 0) {
                this.state.isSwiping = true;
                const clampedDelta = Math.max(deltaX, -this.MAX_SWIPE);
                this.state.activeCard.style.transform = `translateX(${clampedDelta}px)`;
            } else if (deltaX > 0 && this.state.isSwiping) {
                const currentTransform = parseFloat(
                    (this.state.activeCard.style.transform || '').replace(/[^-\d.]/g, '')
                ) || 0;
                const newDelta = Math.min(currentTransform + deltaX, 0);
                this.state.activeCard.style.transform = `translateX(${newDelta}px)`;
            }
        }, { passive: true });

        list.addEventListener('touchend', () => {
            if (!this.state.activeCard) return;
            if (isCardDeleting(this.state.activeCard)) {
                this.state.activeCard = null;
                return;
            }

            const deltaX = this.state.touchCurrentX - this.state.touchStartX;
            const card = this.state.activeCard;

            card.classList.add('animating');

            if (deltaX < -this.DELETE_THRESHOLD) {
                // ✅ 超过阈值 → 停在展开位置，等用户点删除按钮
                card.style.transform = `translateX(-${this.MAX_SWIPE}px)`;
            } else {
                // 未超过阈值 → 回弹
                this.resetCard(card);
            }

            this.state.activeCard = null;
            this.state.isSwiping = false;
        }, { passive: true });

        // ✅ 点击删除按钮 → 执行删除；点击其他区域 → 收回卡片
        list.addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.delete-btn-bg');

            if (!deleteBtn) {
                // 点击非删除区域 → 收回所有展开的卡片
                const openCards = list.querySelectorAll('.transaction-card');
                openCards.forEach(card => {
                    if (isCardDeleting(card)) return;
                    const t = card.style.transform;
                    if (t && t !== 'translateX(0px)' && t !== 'translateX(0)' && t !== '') {
                        this.resetCard(card);
                    }
                });
                return;
            }

            // 点击了删除按钮
            const wrapper = deleteBtn.closest('.transaction-card-wrapper');
            // 防止重复点击导致动画冲突
            if (wrapper.classList.contains('deleting')) return;
            wrapper.classList.add('deleting');

            const id = parseInt(wrapper.dataset.id);
            const card = wrapper.querySelector('.transaction-card');

            // 复位 activeCard 状态，避免 touchend 回调干扰
            if (this.state.activeCard === card) {
                this.state.activeCard = null;
            }

            // 删除动画：整个 wrapper（卡片+删除框）一起滑出并消失
            wrapper.classList.add('animating');
            wrapper.style.transform = 'translateX(-100%)';
            wrapper.style.opacity = '0';
            // 先记录当前高度，再收起到 0，让下方卡片平滑上移
            wrapper.style.maxHeight = wrapper.offsetHeight + 'px';
            requestAnimationFrame(() => {
                wrapper.style.maxHeight = '0';
                wrapper.style.marginBottom = '0';
            });

            setTimeout(() => {
                // 先从 DOM 移除该卡片，确保不会"回来"
                if (wrapper.parentNode) {
                    wrapper.parentNode.removeChild(wrapper);
                }
                this.deleteTransaction(id);
            }, 300);
        });
    }

    resetCard(card) {
        // 正在删除的卡片不复位
        const wrapper = card.closest('.transaction-card-wrapper');
        if (wrapper && wrapper.classList.contains('deleting')) return;

        card.classList.add('animating');
        card.style.transform = 'translateX(0)';
        setTimeout(() => {
            if (card.style.transform === 'translateX(0px)' || card.style.transform === 'translateX(0)') {
                card.style.transform = '';
            }
        }, 300);
    }

    deleteTransaction(id) {
        this.state.transactions = this.state.transactions.filter(t => t.id !== id);
        this.saveToStorage();
        this.renderList();
        console.log('🗑️ 账单已删除:', id);
    }

    // ==================== 持久化存储 ====================
    saveToStorage() {
        try {
            const data = {
                transactions: this.state.transactions,
                budgetLimit: this.state.budgetLimit
            };
            localStorage.setItem('offline_tracker_data', JSON.stringify(data));
        } catch (e) {
            console.error('存储失败:', e);
        }
    }

    loadFromStorage() {
        try {
            const raw = localStorage.getItem('offline_tracker_data');
            if (!raw) return;

            const data = JSON.parse(raw);

            if (Array.isArray(data)) {
                this.state.transactions = data;
            } else {
                this.state.transactions = data.transactions || [];
                this.state.budgetLimit = data.budgetLimit || 3000;
            }
        } catch (e) {
            console.error('读取失败:', e);
        }
    }
}

// ==================== 启动 ====================
document.addEventListener('DOMContentLoaded', () => {
    const app = new TrackerApp();
    app.init();
});