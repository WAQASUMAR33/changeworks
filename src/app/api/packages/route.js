import { NextResponse } from "next/server";
import { z } from "zod";

// Mock data for demonstration
const mockPackages = [
  {
    id: 1,
    name: "Basic Plan",
    description: "Perfect for small organizations getting started with our platform",
    price: 29.99,
    currency: "USD",
    features: [
      "Up to 100 donors",
      "Basic reporting",
      "Email support",
      "Standard templates"
    ],
    duration: "1 month",
    isActive: true,
    category: "basic",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    name: "Premium Plan",
    description: "Advanced features for growing organizations with more complex needs",
    price: 79.99,
    currency: "USD",
    features: [
      "Up to 500 donors",
      "Advanced reporting & analytics",
      "Priority support",
      "Custom templates",
      "API access",
      "Advanced integrations"
    ],
    duration: "1 month",
    isActive: true,
    category: "premium",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 3,
    name: "Enterprise Plan",
    description: "Full-featured solution for large organizations with unlimited needs",
    price: 199.99,
    currency: "USD",
    features: [
      "Unlimited donors",
      "Custom reporting & dashboards",
      "24/7 dedicated support",
      "White-label options",
      "Full API access",
      "All integrations",
      "Custom development",
      "Advanced security features"
    ],
    duration: "1 month",
    isActive: true,
    category: "enterprise",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const packageSchema = z.object({
  name: z.string().min(1, "Package name is required"),
  description: z.string().min(1, "Package description is required"),
  price: z.number().positive("Price must be positive"),
  currency: z.string().default("USD"),
  features: z.array(z.string()).optional().default([]),
  duration: z.string().optional(),
  isActive: z.boolean().default(true),
  category: z.string().optional(),
});

export async function POST(req) {
  try {
    const body = await req.json();
    const input = packageSchema.parse(body);

    // Create new package with mock ID
    const newPackage = {
      id: mockPackages.length + 1,
      name: input.name,
      description: input.description,
      price: input.price,
      currency: input.currency,
      features: input.features || [],
      duration: input.duration,
      isActive: input.isActive,
      category: input.category,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Add to mock data
    mockPackages.push(newPackage);

    return NextResponse.json({
      success: true,
      message: "Package created successfully",
      package: newPackage,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Error creating package:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const isActive = searchParams.get('isActive');

    // Apply filters to mock data
    let filteredPackages = [...mockPackages];
    
    if (search) {
      filteredPackages = filteredPackages.filter(pkg => 
        pkg.name.toLowerCase().includes(search.toLowerCase()) ||
        pkg.description.toLowerCase().includes(search.toLowerCase()) ||
        (pkg.category && pkg.category.toLowerCase().includes(search.toLowerCase()))
      );
    }
    
    if (category) {
      filteredPackages = filteredPackages.filter(pkg => pkg.category === category);
    }
    
    if (isActive !== null && isActive !== undefined) {
      filteredPackages = filteredPackages.filter(pkg => pkg.isActive === (isActive === 'true'));
    }

    return NextResponse.json({
      success: true,
      count: filteredPackages.length,
      packages: filteredPackages,
      mock: true // Indicate this is mock data
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching packages:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
