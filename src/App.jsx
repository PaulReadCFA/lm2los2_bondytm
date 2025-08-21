import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

function Card({ title, children, className = "" }) {
  return (
    <div className={`bg-white rounded-2xl shadow-md p-5 border border-gray-100 ${className}`}>
      <h2 className="font-serif text-xl text-slate-800 mb-3">{title}</h2>
      <div className="font-sans text-sm text-black/80">{children}</div>
    </div>
  );
}

function solveYTM_SemiannualPerPeriod({ price, couponPct, years, face = 100 }) {
  const c = (couponPct / 100) * face;
  const n = years * 2;
  const cf = Array.from({ length: n }, (_, i) => (i === n - 1 ? c / 2 + face : c / 2));
  const pv = (y) => cf.reduce((acc, cash, t) => acc + cash / Math.pow(1 + y, t + 1), 0);
  let lo = 0, hi = 1.0;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (pv(mid) > price) lo = mid; else hi = mid;
  }
  const y = (lo + hi) / 2;
  const bey = 2 * y;
  const ear = (1 + y) ** 2 - 1;
  return { yPer: y, bey, ear, periods: n, cashflows: cf, pvAtY: (yTest)=>pv(yTest) };
}

// Custom label component that shows values above/below bars
const CustomLabel = (props) => {
  const { x, y, width, height, value } = props;
  
  if (!value || Math.abs(value) < 0.01) return null;
  
  const isNegative = value < 0;
  const labelY = isNegative ? y + height + 15 : y - 8;
  
  return (
    <text
      x={x + width / 2}
      y={labelY}
      textAnchor="middle"
      fill="#000"
      fontSize="11"
      fontWeight="bold"
    >
      ${Math.abs(value).toFixed(2)}
    </text>
  );
};

export default function App() {
  const [bondInputs, setBondInputs] = useState({ price: 97.76, couponPct: 11.5, years: 5, face: 100 });
  const bond = useMemo(() => solveYTM_SemiannualPerPeriod(bondInputs), [bondInputs]);

  // Bond cash flow chart data
  const bondChartData = useMemo(() => {
    const couponValue = (bondInputs.couponPct / 100) * bondInputs.face / 2;
    const data = [];
    
    for (let i = 0; i <= bond.periods; i++) {
      const yearLabel = (i * 0.5).toFixed(1);
      let couponFlow = 0;
      let otherFlow = 0;
      
      if (i === 0) {
        // Initial purchase price (negative outflow)
        otherFlow = -bondInputs.price;
      } else if (i === bond.periods) {
        // Final period: coupon + principal repayment
        couponFlow = couponValue;
        otherFlow = bondInputs.face;
      } else {
        // Regular coupon payments
        couponFlow = couponValue;
      }
      
      data.push({
        yearLabel,
        period: i,
        couponFlow,
        otherFlow,
        totalFlow: couponFlow + otherFlow,
        ytmLine: bond.bey * 100,
      });
    }
    
    return data;
  }, [bond, bondInputs]);

  return (
    <div className="min-h-screen bg-gray-50">


      <main className="max-w-6xl mx-auto px-4">
        {/* Bond Inputs & Chart - All in One Card */}
        <Card title="Bond Analysis: Inputs & Cash Flows" className="w-full">
          {/* Inputs Section */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <label className="flex flex-col">
              Price ($)
              <input 
                type="number" 
                step="0.01" 
                value={bondInputs.price}
                onChange={(e) => setBondInputs(v => ({ ...v, price: +e.target.value }))}
                className="mt-1 rounded-lg border px-3 py-2" 
              />
            </label>
            <label className="flex flex-col">
              Coupon % (annual)
              <input 
                type="number" 
                step="0.01" 
                value={bondInputs.couponPct}
                onChange={(e) => setBondInputs(v => ({ ...v, couponPct: +e.target.value }))}
                className="mt-1 rounded-lg border px-3 py-2" 
              />
            </label>
            <label className="flex flex-col">
              Years to Maturity
              <input 
                type="number" 
                step="0.5" 
                value={bondInputs.years}
                onChange={(e) => setBondInputs(v => ({ ...v, years: +e.target.value }))}
                className="mt-1 rounded-lg border px-3 py-2" 
              />
            </label>
          </div>

          {/* YTM Results */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="text-3xl font-serif text-blue-600 mb-2">{(bond.bey * 100).toFixed(2)}%</div>
            <div className="text-sm text-gray-700">
              <div>Bond-equivalent Yield (semiannual compounding)</div>
              <div className="mt-1">Per-period (6mo): {(bond.yPer * 100).toFixed(2)}% | EAR: {(bond.ear * 100).toFixed(2)}%</div>
            </div>
          </div>

          {/* Chart Legend */}
          <div className="mb-4 text-sm text-gray-600 flex items-center gap-6">
            <span className="inline-flex items-center">
              <span className="w-4 h-4 bg-blue-500 mr-2 rounded"></span>
              Coupon Cash Flow
            </span>
            <span className="inline-flex items-center">
              <span className="w-4 h-4 bg-orange-400 mr-2 rounded"></span>
              Principal/Purchase
            </span>
            <span className="inline-flex items-center">
              <span className="w-4 h-4 bg-green-600 mr-2 rounded"></span>
              YTM: {(bond.bey * 100).toFixed(2)}%
            </span>
          </div>

          {/* Cash Flow Chart */}
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={bondChartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="yearLabel" 
                  label={{ value: 'Years', position: 'insideBottom', offset: -10 }}
                />
                <YAxis 
                  yAxisId="left"
                  label={{ value: 'Cash Flows ($)', angle: -90, position: 'insideLeft' }}
                  tickFormatter={(value) => `$${value}`}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  label={{ value: 'Yield (%)', angle: 90, position: 'insideRight' }}
                  tickFormatter={(value) => `${value.toFixed(1)}%`}
                  domain={[0, Math.ceil(bond.bey * 100 * 1.2)]}
                />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'Yield to Maturity') return [`${Number(value).toFixed(2)}%`, name];
                    return [`$${Number(value).toFixed(2)}`, name];
                  }}
                  labelFormatter={(label) => `Time: ${label} years`}
                />
                
                {/* Stacked bars for cash flows */}
                <Bar 
                  yAxisId="left" 
                  dataKey="couponFlow" 
                  stackId="cash" 
                  fill="#3b82f6" 
                  name="Coupon Cash Flow"
                  label={CustomLabel}
                />
                <Bar 
                  yAxisId="left" 
                  dataKey="otherFlow" 
                  stackId="cash" 
                  fill="#fb923c" 
                  name="Principal/Purchase"
                  label={CustomLabel}
                />
                
                {/* YTM line */}
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="ytmLine" 
                  stroke="#16a34a" 
                  strokeWidth={3}
                  dot={false}
                  name="Yield to Maturity"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </main>


    </div>
  );
}