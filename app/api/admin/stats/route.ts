import { listOrders, listProducts } from "@/lib/db";
import { isAuthorizedAdminRequest } from "@/lib/admin";
import { jsonError } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAuthorizedAdminRequest())) return jsonError("دسترسی غیرمجاز است.", 403);
  const [orders, products] = await Promise.all([listOrders(500), listProducts(true)]);
  const revenue = orders.reduce((sum, order) => sum + order.total, 0);
  const itemCount = orders.reduce(
    (sum, order) => sum + order.items.reduce((inner, item) => inner + item.quantity, 0),
    0,
  );
  const productSales = new Map<string, { name: string; quantity: number; revenue: number }>();
  for (const order of orders) {
    for (const item of order.items) {
      const current = productSales.get(item.productId) ?? { name: item.name, quantity: 0, revenue: 0 };
      current.quantity += item.quantity;
      current.revenue += item.lineTotal;
      productSales.set(item.productId, current);
    }
  }
  const topProducts = [...productSales.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  return Response.json({
    stats: {
      revenue,
      orderCount: orders.length,
      itemCount,
      averageOrder: orders.length ? Math.round(revenue / orders.length) : 0,
      activeProducts: products.filter((product) => product.active).length,
      lowStock: products.filter((product) => product.active && product.stockQty <= 5).length,
      topProducts,
    },
  });
}
