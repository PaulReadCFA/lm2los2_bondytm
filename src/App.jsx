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

// Shared Components
function Card({ title, children, className = "" }) {
  return (
    <div className={`bg-white rounded-2xl shadow-md p-5 border border-gray-100 ${className}`}>
      <h1 className="font-serif text-2xl text-slate-800 mb-3">{title}</h1>
      <div className="font-sans text-sm text-black/80">{children}</div>
    </div>
  );
}

function FormField({ id, label, children, error, helpText, required = false }) {
  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
        {helpText && <span className="text-gray-500 text-xs font-normal ml-2">({helpText})</span>}
      </label>
      {children}
      {error && (
        <div className="text-red-600 text-xs mt-1" role="alert" id={`${id}-error`}>
          {error}
        </div>
      )}
    </div>
  );
}

function ValidationMessage({ errors }) {
  if (!errors || Object.keys(errors).length === 0) return null;
  
  return (
    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg" role="alert">
      <h2 className="text-red-800 font-semibold text-sm mb-2">Please correct the following:</h2>
      <ul className="text-red-800 text-sm space-y-1">
        {Object.entries(errors).map(([field, error]) => (
          <li key={field}>• {error}</li>
        ))}
      </ul>
    </div>
  );
}

function ResultCard({ title, value, subtitle, description, isValid = true }) {
  if (!isValid) return null;
  
  return (
    <div className="mb-6 p-4 bg-blue-50 rounded-lg">
      <div className="text-3xl font-serif text-blue-600 mb-2" aria-live="polite">{value}</div>
      <div className="text-sm text-gray-700">
        <div><strong>{title}</strong> - {subtitle}</div>
        <div className="mt-1">{description}</div>
      </div>
    </div>
  );
}

// Enhanced Custom label component that shows values consistently positioned
const CustomLabel = (props) => {
  const { x, y, width, height, value } = props;
  
  if (!value || Math.abs(value) < 0.01) return null;
  
  const isNegative = value < 0;
  // Position all labels above the bar area for consistency
  const labelY = y - 8;
  
  return (
    <text
      x={x + width / 2}
      y={labelY}
      textAnchor="middle"
      fill="#000"
      fontSize="11"
      fontWeight="bold"
    >
      {isNegative ? '(' : ''}${Math.abs(value).toFixed(2)}{isNegative ? ')' : ''}
    </text>
  );
};

export default function BondYTMCalculator() {
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
    
    // YTM calculation with semiannual compounding
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

  const chartData = useMemo(() => {
    if (!bond) return [];
    
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
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Card title="Coupon Bond Implied Return / Yield Calculator">
          {/* Skip Navigation */}
          <nav className="mb-4">
            <a href="#bond-inputs" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-3 py-1 rounded">
              Skip to inputs
            </a>
            <a href="#bond-results" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-20 bg-blue-600 text-white px-3 py-1 rounded">
              Skip to results
            </a>
            <a href="#bond-chart" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-36 bg-blue-600 text-white px-3 py-1 rounded">
              Skip to chart
            </a>
          </nav>

          {/* Inputs */}
          <section id="bond-inputs" aria-labelledby="inputs-heading">
            <h2 id="inputs-heading" className="sr-only">Bond Parameters</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <FormField 
                id="bond-price" 
                label="Bond Price" 
                helpText="$50 - $150"
                error={inputErrors.price}
                required
              >
                <input
                  id="bond-price"
                  type="number"
                  step="0.01"
                  min="50"
                  max="150"
                  value={inputs.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  className="mt-1 rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                  aria-describedby={inputErrors.price ? "bond-price-error" : "bond-price-help"}
                  aria-invalid={inputErrors.price ? 'true' : 'false'}
                />
                <div id="bond-price-help" className="sr-only">Enter the current market price of the bond</div>
              </FormField>

              <FormField 
                id="coupon-rate" 
                label="Annual Coupon Rate (%)" 
                helpText="0% - 20%"
                error={inputErrors.couponPct}
                required
              >
                <input
                  id="coupon-rate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="20"
                  value={inputs.couponPct}
                  onChange={(e) => handleInputChange('couponPct', e.target.value)}
                  className="mt-1 rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                  aria-describedby={inputErrors.couponPct ? "coupon-rate-error" : "coupon-rate-help"}
                  aria-invalid={inputErrors.couponPct ? 'true' : 'false'}
                />
                <div id="coupon-rate-help" className="sr-only">Enter the annual coupon rate as a percentage</div>
              </FormField>

              <FormField 
                id="years-maturity" 
                label="Years to Maturity" 
                helpText="0.5 - 10 years"
                error={inputErrors.years}
                required
              >
                <input
                  id="years-maturity"
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="10"
                  value={inputs.years}
                  onChange={(e) => handleInputChange('years', e.target.value)}
                  className="mt-1 rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                  aria-describedby={inputErrors.years ? "years-maturity-error" : "years-maturity-help"}
                  aria-invalid={inputErrors.years ? 'true' : 'false'}
                />
                <div id="years-maturity-help" className="sr-only">Enter the number of years until the bond matures</div>
              </FormField>
            </div>
          </section>

          <ValidationMessage errors={inputErrors} />

          {/* Results */}
          <section id="bond-results" aria-labelledby="results-heading">
            <h2 id="results-heading" className="sr-only">Calculation Results</h2>
            {bond && (
              <ResultCard
                title="YTM (Yield to Maturity)"
                value={`${(bond.bey * 100).toFixed(2)}%`}
                subtitle="the annualized return if held to maturity"
                description="Calculated with semiannual compounding"
                isValid={true}
              />
            )}
          </section>

          {/* Screen Reader Data Table */}
          {bond && (
            <div className="sr-only">
              <h2>Bond Cash Flow Data Table</h2>
              <table>
                <caption>Bond cash flow data showing coupon payments and principal repayment over time</caption>
                <thead>
                  <tr>
                    <th scope="col">Time (Years)</th>
                    <th scope="col">Coupon Payment ($)</th>
                    <th scope="col">Principal/Purchase ($)</th>
                    <th scope="col">YTM (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.map(row => (
                    <tr key={row.period}>
                      <th scope="row">{row.yearLabel}</th>
                      <td className="text-right">{row.couponFlow ? `${row.couponFlow.toFixed(2)}` : '--'}</td>
                      <td className="text-right">{row.otherFlow ? (row.otherFlow < 0 ? `(${Math.abs(row.otherFlow).toFixed(2)})` : `${row.otherFlow.toFixed(2)}`) : '--'}</td>
                      <td className="text-right">{row.ytmLine.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Chart */}
          {bond && (
            <section id="bond-chart" aria-labelledby="chart-heading">
              <h2 id="chart-heading" className="sr-only">Visual Chart</h2>
              
              <div className="text-center mb-4">
                <h3 className="font-serif text-lg text-slate-700">Coupon Bond Implied Return / Yield</h3>
              </div>
              
              <div className="mb-4 text-sm text-gray-600 flex flex-wrap items-center gap-6" role="img" aria-label="Chart legend">
                <span className="inline-flex items-center">
                  <span className="w-4 h-4 bg-blue-500 mr-2 rounded" aria-hidden="true"></span>
                  Coupon Payments
                </span>
                <span className="inline-flex items-center">
                  <span className="w-4 h-4 bg-orange-400 mr-2 rounded" aria-hidden="true"></span>
                  Principal/Purchase
                </span>
                <span className="inline-flex items-center">
                  <span className="w-4 h-4 bg-green-600 mr-2 rounded" aria-hidden="true"></span>
                  YTM: {(bond.bey * 100).toFixed(2)}%
                </span>
              </div>

              <div className="h-96" 
                   role="img" 
                   aria-labelledby="bond-chart-title" 
                   aria-describedby="bond-chart-description">
                
                <div className="sr-only">
                  <h3 id="bond-chart-title">Bond Cash Flow and Yield Chart</h3>
                  <p id="bond-chart-description">
                    Bar chart showing bond purchase price of ${inputs.price.toFixed(2)} at time 0, semiannual coupon payments of approximately ${((inputs.couponPct / 100) * inputs.face / 2).toFixed(2)}, 
                    and principal repayment of $${inputs.face} at maturity, with calculated YTM of {(bond.bey * 100).toFixed(2)}%
                  </p>
                </div>

                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={chartData}
                    margin={{ top: 30, right: 30, left: 20, bottom: 20 }}
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
                    
                    <Bar 
                      yAxisId="left" 
                      dataKey="couponFlow" 
                      stackId="cash" 
                      fill="#3b82f6" 
                      name="Coupon Payments"
                      label={<CustomLabel />}
                    />
                    <Bar 
                      yAxisId="left" 
                      dataKey="otherFlow" 
                      stackId="cash" 
                      fill="#fb923c" 
                      name="Principal/Purchase"
                      label={<CustomLabel />}
                    />
                    
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

              <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                <strong>Bond Yield to Maturity:</strong> The internal rate of return if the bond is held to maturity. 
                This assumes all coupon payments are reinvested at the YTM rate and the bond is held until it matures.
              </div>
            </section>
          )}

          {/* Educational Context */}
          <section className="mt-8 p-4 bg-blue-50 rounded-lg" aria-labelledby="education-heading">
            <h2 id="education-heading" className="font-semibold text-blue-800 mb-2">Educational Context</h2>
            <div className="text-sm text-blue-700 space-y-2">
              <p><strong>Yield to Maturity (YTM):</strong> The total return anticipated on a bond if held until maturity, expressed as an annual rate.</p>
              <p><strong>Calculation Method:</strong> Uses iterative numerical methods to find the discount rate that equates the present value of all future cash flows to the current bond price.</p>
              <p><strong>Assumptions:</strong> All coupon payments are reinvested at the YTM rate, and the bond is held to maturity.</p>
              <p className="text-xs mt-2"><strong>Note:</strong> This model uses semiannual compounding, which is standard for most bonds. Consider additional factors such as credit risk and callability in real investment decisions.</p>
            </div>
          </section>
        </Card>
      </main>
    </div>
  );
}