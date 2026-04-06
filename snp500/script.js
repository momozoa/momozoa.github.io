const AVG_RETURN_RATE = 0.1; // S&P 500 연평균 수익률 10%

let assets1, assets2, invested1, invested2;

document.addEventListener('DOMContentLoaded', function() {
    updateValues();
    calculateScenario1();
    calculateScenario2();
    updateReport1();
    updateReport2();
});

// 공통 슬라이더 이벤트
['currentAge', 'lifeExpectancy', 'livingExpense'].forEach(id => {
    document.getElementById(id).addEventListener('input', function() {
        updateValues();
        calculateScenario1();
        calculateScenario2();
        updateReport1();
        updateReport2();
    });
});

// 시나리오 1 슬라이더 이벤트
['initial1', 'monthly1', 'retirementAge1'].forEach(id => {
    document.getElementById(id).addEventListener('input', function() {
        updateValues();
        calculateScenario1();
        updateReport1();
    });
});

// 시나리오 2 슬라이더 이벤트
['initial2', 'monthly2', 'retirementAge2'].forEach(id => {
    document.getElementById(id).addEventListener('input', function() {
        updateValues();
        calculateScenario2();
        updateReport2();
    });
});

function updateValues() {
    document.getElementById('initial1Value').textContent = document.getElementById('initial1').value;
    document.getElementById('monthly1Value').textContent = document.getElementById('monthly1').value;
    document.getElementById('retirementAge1Value').textContent = document.getElementById('retirementAge1').value;
    document.getElementById('initial2Value').textContent = document.getElementById('initial2').value;
    document.getElementById('monthly2Value').textContent = document.getElementById('monthly2').value;
    document.getElementById('retirementAge2Value').textContent = document.getElementById('retirementAge2').value;
    document.getElementById('currentAgeValue').textContent = document.getElementById('currentAge').value;
    document.getElementById('lifeExpectancyValue').textContent = document.getElementById('lifeExpectancy').value;
    document.getElementById('livingExpenseValue').textContent = document.getElementById('livingExpense').value;
}

function calculateScenario1() {
    const initial1 = parseFloat(document.getElementById('initial1').value) || 0;
    const monthly1 = parseFloat(document.getElementById('monthly1').value) || 0;
    const retirementAge1 = parseInt(document.getElementById('retirementAge1').value) || 55;
    const currentAge = parseInt(document.getElementById('currentAge').value) || 30;
    const lifeExpectancy = parseInt(document.getElementById('lifeExpectancy').value) || 90;
    const livingExpense = parseFloat(document.getElementById('livingExpense').value) || 4000;
    const years1 = retirementAge1 - currentAge;

    assets1 = calculateAssets(initial1, monthly1, years1, lifeExpectancy, livingExpense, currentAge);
    invested1 = calculateInvested(initial1, monthly1, years1, lifeExpectancy, currentAge);

    drawChart('chart1', assets1, invested1, '시나리오 1 연도별 자산 성장', currentAge);
}

function calculateScenario2() {
    const initial2 = parseFloat(document.getElementById('initial2').value) || 0;
    const monthly2 = parseFloat(document.getElementById('monthly2').value) || 0;
    const retirementAge2 = parseInt(document.getElementById('retirementAge2').value) || 55;
    const currentAge = parseInt(document.getElementById('currentAge').value) || 30;
    const lifeExpectancy = parseInt(document.getElementById('lifeExpectancy').value) || 90;
    const livingExpense = parseFloat(document.getElementById('livingExpense').value) || 4000;
    const years2 = retirementAge2 - currentAge;

    assets2 = calculateAssets(initial2, monthly2, years2, lifeExpectancy, livingExpense, currentAge);
    invested2 = calculateInvested(initial2, monthly2, years2, lifeExpectancy, currentAge);

    drawChart('chart2', assets2, invested2, '시나리오 2 연도별 자산 성장', currentAge);
}

function updateReport1() {
    const initial1 = parseFloat(document.getElementById('initial1').value) || 0;
    const monthly1 = parseFloat(document.getElementById('monthly1').value) || 0;
    const retirementAge1 = parseInt(document.getElementById('retirementAge1').value) || 55;
    const currentAge = parseInt(document.getElementById('currentAge').value) || 30;
    const lifeExpectancy = parseInt(document.getElementById('lifeExpectancy').value) || 90;
    const livingExpense = parseFloat(document.getElementById('livingExpense').value) || 4000;
    const years1 = retirementAge1 - currentAge;

    const totalInvested1 = initial1 + (monthly1 * 12 * years1);
    const finalAsset1 = assets1[assets1.length - 1];
    const totalProfit1 = finalAsset1 - totalInvested1;
    const roi1 = (totalProfit1 / totalInvested1) * 100;
    const retirementYears1 = lifeExpectancy - retirementAge1;
    const totalWithdrawn1 = livingExpense * retirementYears1;

    document.getElementById('finalAsset1').textContent = formatNumber(finalAsset1);
    document.getElementById('totalInvested1').textContent = formatNumber(totalInvested1);
    document.getElementById('totalProfit1').textContent = formatNumber(totalProfit1);
    document.getElementById('totalWithdrawn1').textContent = formatNumber(totalWithdrawn1);
    document.getElementById('roi1').textContent = roi1.toFixed(2) + '%';
}

function updateReport2() {
    const initial2 = parseFloat(document.getElementById('initial2').value) || 0;
    const monthly2 = parseFloat(document.getElementById('monthly2').value) || 0;
    const retirementAge2 = parseInt(document.getElementById('retirementAge2').value) || 55;
    const currentAge = parseInt(document.getElementById('currentAge').value) || 30;
    const lifeExpectancy = parseInt(document.getElementById('lifeExpectancy').value) || 90;
    const livingExpense = parseFloat(document.getElementById('livingExpense').value) || 4000;
    const years2 = retirementAge2 - currentAge;

    const totalInvested2 = initial2 + (monthly2 * 12 * years2);
    const finalAsset2 = assets2[assets2.length - 1];
    const totalProfit2 = finalAsset2 - totalInvested2;
    const roi2 = (totalProfit2 / totalInvested2) * 100;
    const retirementYears2 = lifeExpectancy - retirementAge2;
    const totalWithdrawn2 = livingExpense * retirementYears2;

    document.getElementById('finalAsset2').textContent = formatNumber(finalAsset2);
    document.getElementById('totalInvested2').textContent = formatNumber(totalInvested2);
    document.getElementById('totalProfit2').textContent = formatNumber(totalProfit2);
    document.getElementById('totalWithdrawn2').textContent = formatNumber(totalWithdrawn2);
    document.getElementById('roi2').textContent = roi2.toFixed(2) + '%';
}

function calculateAssets(initial, monthly, years, lifeExpectancy, livingExpense, currentAge) {
    const totalYears = lifeExpectancy - currentAge;
    const assets = [];
    let currentAsset = initial;
    const monthlyRate = AVG_RETURN_RATE / 12;

    for (let year = 0; year < totalYears; year++) {
        if (year < years) {
            // 투자 기간: 적립
            for (let month = 0; month < 12; month++) {
                currentAsset *= (1 + monthlyRate);
                currentAsset += monthly;
            }
        } else {
            // 은퇴 후: 복리 적용 후 연간 생활비 차감
            for (let month = 0; month < 12; month++) {
                currentAsset *= (1 + monthlyRate);
            }
            currentAsset -= livingExpense;
            if (currentAsset < 0) currentAsset = 0; // 자산이 음수가 되지 않도록
        }
        assets.push(currentAsset);
    }
    return assets;
}

function calculateInvested(initial, monthly, years, lifeExpectancy, currentAge) {
    const totalYears = lifeExpectancy - currentAge;
    const invested = [];
    for (let year = 1; year <= totalYears; year++) {
        if (year <= years) {
            invested.push(initial + monthly * 12 * year);
        } else {
            invested.push(initial + monthly * 12 * years);
        }
    }
    return invested;
}

function formatNumber(num) {
    return Math.round(num).toLocaleString('ko-KR');
}

function drawChart(canvasId, assets, invested, title, currentAge) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    // 기존 차트 파괴
    if (window[canvasId + 'Chart']) {
        window[canvasId + 'Chart'].destroy();
    }
    const labels = assets.map((_, index) => `${index + 1}년 (${currentAge + index + 1})`);
    window[canvasId + 'Chart'] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '자산 가치',
                data: assets,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: true
            }, {
                label: '누적 투자 원금',
                data: invested,
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                fill: false
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: title
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + Math.round(context.parsed.y).toLocaleString('ko-KR');
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: '투자 연도 (나이)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: '자산 가치'
                    },
                    ticks: {
                        callback: function(value) {
                            return Math.round(value).toLocaleString('ko-KR');
                        }
                    }
                }
            }
        }
    });
}