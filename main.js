/**
 * 极简记账-核心逻辑入口
 */

document.addEventListener('DOMContentLoaded',()=>{
    console.log('H5应用已加载，DOM就绪')
})

//获取DOM元素
const btnAdd = document.getElementById('btn-add');
const listContainer = document.getElementById('transaction-list');

//绑定添加按钮事件
btnAdd.addEventListener('click',()=>{
    alert('唤起记账面板（下一步实现）');
    console.log('添加按钮点击事件触发');
})

