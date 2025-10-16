import { useMemo, useState, useCallback } from "react";
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

// CFA-branded color palette
const COLORS = {
  primary: "#4476ff",
  dark: "#06005a",
  darkAlt: "#38337b",
  positive: "#6991ff",
  negative: "#ea792d",
  purple: "#7a46ff",
  purpleAlt: "#50037f",
  lightBlue: "#4476ff",
  orange: "#ea792d",
  darkText: "#06005a",
  green: "#16a34a",
  blue: "#3b82f6",
  orangeBar: "#fb923c",
};

function Card({ title, children, className = "" }) {
  return (
    <div className={`bg-white rounded-2xl shadow-md p-5 border border-gray-100 ${className}`}>
      <h2 className="font-serif text-xl text-slate-800 mb-3">{title}</h2>
      <div className="font-sans text-sm text-black/80">{children}</div>
    </div>
  );
}

function InfoIcon({ children, id }) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  return (
    <div className="relative inline-block ml-1">
      <button
        type="button"
        className="w-4 h-4 rounded-full bg-gray-400 text-white text-xs font-bold hover:bg-gray-500 focus:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        aria-describedby={`${id}-tooltip`}
        aria-label="More information"
      >
        ?
      </button>
      
      {showTooltip && (
        <div
          id={`${id}-tooltip`}
          role="tooltip"
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap z-10 max-w-xs"
        >
          {children}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-800"></div>
        </div>
      )}
    </div>
  );
}

function ValidationMessage({ errors }) {
  if (!errors || Object.keys(errors).length === 0) return null;
  
  return (
    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg" role="alert">
      <h3 className="text-red-800 font-semibold text-sm mb-2">Please correct the following:</h3>
      <ul className="text-red-800 text-sm space-y-1">
        {Object.entries(errors).map(([field, error]) => (
          <li key={field}>• {error}</li>
        ))}
      </ul>
    </div>
  );
}

const CustomLabel = (props) => {
  const { x, y, width, height, value } = props;
  if (!value || Math.abs(value) < 0.01) return null;
  
  const isNegative = value < 0;
  const labelY = y - 8;
  
  return (
    <text x={x + width / 2} y={labelY} textAnchor="middle" fill={COLORS.darkText} fontSize="11" fontWeight="bold">
      {isNegative ? '(' : ''}${Math.abs(value).toFixed(2)}{isNegative ? ')' : ''}
    </text>
  );
};

function ResultsSection({ bond, inputs }) {
  return (
    <div className="space-y-6">
      {/* YTM Result */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="text-3xl font-serif text-blue-600 mb-2">{(bond.bey * 100).toFixed(2)}%</div>
        <div className="text-sm text-gray-700">
          <div><strong>Yield to Maturity (YTM)</strong> - annualized return if held to maturity</div>
          <div className="mt-2 text-xs">
            Calculated with semiannual compounding
          </div>
        </div>
      </div>

      {/* Bond Details */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-sm text-gray-700">
          <div className="font-semibold mb-2">Bond Details</div>
          <div className="text-xs space-y-1">
            <div>• Coupon: {inputs.couponPct.toFixed(2)}% annual</div>
            <div>• Semiannual payment: ${((inputs.couponPct / 100) * inputs.face / 2).toFixed(2)}</div>
            <div>• Periods: {bond.periods} (semiannual)</div>
            <div>• Years: {inputs.years}</div>
          </div>
        </div>
      </div>

      {/* Price vs Par */}
      <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
        <div className="text-sm text-purple-700">
          <div className="font-semibold mb-1">Price vs Par</div>
          <div className="text-xs">
            {inputs.price < inputs.face && "Trading at discount (Price < Par)"}
            {inputs.price === inputs.face && "Trading at par (Price = Par)"}
            {inputs.price > inputs.face && "Trading at premium (Price > Par)"}
          </div>
        </div>
      </div>
    </div>
  );
}

function BondChart({ bond, inputs }) {
  const chartData = useMemo(() => {
    const couponValue = (inputs.couponPct / 100) * inputs.face / 2;
    const data = [];
    
    for (let i = 0; i <= bond.periods; i++) {
      const yearLabel = (i * 0.5).toFixed(1);
      let couponFlow = 0;
      let otherFlow = 0;
      
      if (i === 0) {
        otherFlow = -inputs.price;
      } else if (i === bond.periods) {
        couponFlow = couponValue;
        otherFlow = inputs.face;
      } else {
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
  }, [bond, inputs]);

  return (
    <>
      {/* Legend */}
      <div className="mb-4 text-sm text-gray-600 flex flex-wrap items-center gap-6">
        <span className="inline-flex items-center">
          <span className="w-3 h-3 mr-2 rounded" style={{backgroundColor: COLORS.blue}}></span>
          Coupon Payments
        </span>
        <span className="inline-flex items-center">
          <span className="w-3 h-3 mr-2 rounded" style={{backgroundColor: COLORS.orangeBar}}></span>
          Principal/Purchase
        </span>
        <span className="inline-flex items-center">
          <span className="w-3 h-3 mr-2 rounded" style={{backgroundColor: COLORS.green}}></span>
          YTM: {(bond.bey * 100).toFixed(2)}%
        </span>
      </div>

      {/* Chart */}
      <div className="h-96" role="img" aria-labelledby="chart-title" aria-describedby="chart-description">
        <div className="sr-only">
          <h3 id="chart-title">Bond Cash Flow and Yield Chart</h3>
          <p id="chart-description">
            Bar chart showing bond purchase price of ${inputs.price.toFixed(2)} at time 0, semiannual coupon payments, 
            and principal repayment of ${inputs.face} at maturity, with calculated YTM of {(bond.bey * 100).toFixed(2)}%
          </p>
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 30, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="yearLabel" label={{ value: 'Years', position: 'insideBottom', offset: -10 }} />
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
            
            <Bar yAxisId="left" dataKey="couponFlow" stackId="cash" fill={COLORS.blue} name="Coupon Payments" label={<CustomLabel />} />
            <Bar yAxisId="left" dataKey="otherFlow" stackId="cash" fill={COLORS.orangeBar} name="Principal/Purchase" label={<CustomLabel />} />
            <Line yAxisId="right" type="monotone" dataKey="ytmLine" stroke={COLORS.green} strokeWidth={3} dot={false} name="Yield to Maturity" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Educational note */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
        <strong>Bond Yield to Maturity:</strong> The internal rate of return if held to maturity, assuming all coupons are reinvested at the YTM rate.
      </div>
    </>
  );
}

export default function App() {
  const [inputs, setInputs] = useState({ 
    price: 97.76, 
    couponPct: 11.0088, 
    years: 5, 
    face: 100 
  });
  
  const validateInputs = useCallback((inputs) => {
    const errors = {};
    if (!inputs.price || inputs.price < 50) {
      errors.price = "Price must be at least $50";
    } else if (inputs.price > 150) {
      errors.price = "Price cannot exceed $150";
    }
    
    if (inputs.couponPct < 0) {
      errors.couponPct = "Coupon rate cannot be negative";
    } else if (inputs.couponPct > 20) {
      errors.couponPct = "Coupon rate cannot exceed 20%";
    }
    
    if (!inputs.years || inputs.years <= 0) {
      errors.years = "Years to maturity must be positive";
    } else if (inputs.years > 10) {
      errors.years = "Years to maturity cannot exceed 10";
    }
    
    return errors;
  }, []);
  
  const handleInputChange = useCallback((field, value) => {
    setInputs(prev => ({ ...prev, [field]: +value }));
  }, []);
  
  const inputErrors = validateInputs(inputs);
  
  const bond = useMemo(() => {
    if (Object.keys(inputErrors).length > 0) return null;
    
    const c = (inputs.couponPct / 100) * inputs.face;
    const n = inputs.years * 2;
    const cf = Array.from({ length: n }, (_, i) => 
      (i === n - 1 ? c / 2 + inputs.face : c / 2)
    );
    
    const pv = (y) => cf.reduce((acc, cash, t) => acc + cash / Math.pow(1 + y, t + 1), 0);
    
    let lo = 0, hi = 1.0;
    for (let i = 0; i < 200; i++) {
      const mid = (lo + hi) / 2;
      if (pv(mid) > inputs.price) lo = mid; else hi = mid;
    }
    
    const y = (lo + hi) / 2;
    const bey = 2 * y;
    
    return { yPer: y, bey, periods: n, cashflows: cf };
  }, [inputs, inputErrors]);

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <main className="max-w-7xl mx-auto space-y-6">

        {/* RESULTS AND CHART */}
        {bond && (
          <>
            {/* MOBILE */}
            <div className="lg:hidden space-y-6">
              <Card title="Results">
                <ResultsSection bond={bond} inputs={inputs} />
              </Card>
              <Card title="Bond Cash Flow Analysis">
                <BondChart bond={bond} inputs={inputs} />
              </Card>
            </div>

            {/* DESKTOP */}
            <div className="hidden lg:grid lg:grid-cols-5 gap-6">
              <div className="lg:col-span-1">
                <Card title="Results">
                  <ResultsSection bond={bond} inputs={inputs} />
                </Card>
              </div>
              <div className="lg:col-span-4">
                <Card title="Bond Cash Flow Analysis">
                  <BondChart bond={bond} inputs={inputs} />
                </Card>
              </div>
            </div>
          </>
        )}

        {/* INPUTS */}
        <Card title="Coupon Bond Implied Return / Yield Calculator">
          <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
            
            <div className="flex items-center gap-2">
              <label htmlFor="price" className="font-medium text-gray-700 whitespace-nowrap flex items-center text-sm">
                Bond Price
                <span className="text-red-500 ml-1">*</span>
                <InfoIcon id="price">Current market price</InfoIcon>
              </label>
              <div className="w-24">
                <input
                  id="price"
                  type="number"
                  step="0.01"
                  value={inputs.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  className={`block w-full rounded-md shadow-sm px-2 py-2 text-sm ${
                    inputErrors.price ? 'border-red-300' : 'border-gray-300'
                  } focus:border-blue-500 focus:ring-blue-500`}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="coupon" className="font-medium text-gray-700 whitespace-nowrap flex items-center text-sm">
                Coupon Rate (%)
                <span className="text-red-500 ml-1">*</span>
                <InfoIcon id="coupon">Annual coupon rate</InfoIcon>
              </label>
              <div className="w-24">
                <input
                  id="coupon"
                  type="number"
                  step="0.01"
                  value={inputs.couponPct}
                  onChange={(e) => handleInputChange('couponPct', e.target.value)}
                  className={`block w-full rounded-md shadow-sm px-2 py-2 text-sm ${
                    inputErrors.couponPct ? 'border-red-300' : 'border-gray-300'
                  } focus:border-blue-500 focus:ring-blue-500`}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="years" className="font-medium text-gray-700 whitespace-nowrap flex items-center text-sm">
                Years to Maturity
                <span className="text-red-500 ml-1">*</span>
                <InfoIcon id="years">Years until maturity</InfoIcon>
              </label>
              <div className="w-24">
                <input
                  id="years"
                  type="number"
                  step="0.5"
                  value={inputs.years}
                  onChange={(e) => handleInputChange('years', e.target.value)}
                  className={`block w-full rounded-md shadow-sm px-2 py-2 text-sm ${
                    inputErrors.years ? 'border-red-300' : 'border-gray-300'
                  } focus:border-blue-500 focus:ring-blue-500`}
                />
              </div>
            </div>

          </div>
          
          <ValidationMessage errors={inputErrors} />
        </Card>

      </main>
    </div>
  );
}