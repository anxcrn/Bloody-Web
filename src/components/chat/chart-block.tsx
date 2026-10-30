import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";

interface Spec {
  type: "bar" | "line" | "area" | "pie";
  title?: string;
  data: Record<string, string | number>[];
}

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function parse(source: string): Spec | null {
  try {
    const j = JSON.parse(source) as Partial<Spec>;
    if (!j || !Array.isArray(j.data) || j.data.length === 0) return null;
    const type = j.type && ["bar", "line", "area", "pie"].includes(j.type) ? j.type : "bar";
    const spec: Spec = { type, data: j.data };
    if (j.title) spec.title = j.title;
    return spec;
  } catch {
    return null;
  }
}

export function ChartBlock({ source }: { source: string }) {
  const spec = parse(source);
  if (!spec) {
    return <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">Drawing chart…</div>;
  }
  const keys = Object.keys(spec.data[0] ?? {}).filter((k) => k !== "name" && typeof spec.data[0]?.[k] === "number");
  const axis = { stroke: "var(--muted-foreground)", fontSize: 12 };

  return (
    <figure className="my-3 rounded-2xl border border-border bg-card p-4">
      {spec.title && <figcaption className="mb-2 text-sm font-semibold">{spec.title}</figcaption>}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {spec.type === "pie" ? (
            <PieChart>
              <Pie data={spec.data} dataKey={keys[0] ?? "value"} nameKey="name" outerRadius={90} label>
                {spec.data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length] ?? "var(--chart-1)"} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          ) : spec.type === "line" ? (
            <LineChart data={spec.data}>
              <CartesianGrid stroke="var(--border)" />
              <XAxis dataKey="name" {...axis} />
              <YAxis {...axis} />
              <Tooltip />
              {keys.length > 1 && <Legend />}
              {keys.map((k, i) => (
                <Line key={k} dataKey={k} stroke={COLORS[i % COLORS.length] ?? "var(--chart-1)"} strokeWidth={2} />
              ))}
            </LineChart>
          ) : spec.type === "area" ? (
            <AreaChart data={spec.data}>
              <CartesianGrid stroke="var(--border)" />
              <XAxis dataKey="name" {...axis} />
              <YAxis {...axis} />
              <Tooltip />
              {keys.length > 1 && <Legend />}
              {keys.map((k, i) => (
                <Area key={k} dataKey={k} stroke={COLORS[i % COLORS.length] ?? "var(--chart-1)"} fill={COLORS[i % COLORS.length] ?? "var(--chart-1)"} fillOpacity={0.25} />
              ))}
            </AreaChart>
          ) : (
            <BarChart data={spec.data}>
              <CartesianGrid stroke="var(--border)" />
              <XAxis dataKey="name" {...axis} />
              <YAxis {...axis} />
              <Tooltip />
              {keys.length > 1 && <Legend />}
              {keys.map((k, i) => (
                <Bar key={k} dataKey={k} fill={COLORS[i % COLORS.length] ?? "var(--chart-1)"} radius={[6, 6, 0, 0]} />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
