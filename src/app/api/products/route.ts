import { NextRequest, NextResponse } from "next/server";
import { Query } from "node-appwrite";
import {
    createSessionClient,
    DATABASE_ID,
    COLLECTIONS,
} from "@/lib/appwrite-server";

// GET all products
export async function GET() {
    try {
        const { account, databases } = await createSessionClient();

        // Get current user
        const user = await account.get();
        if (!user) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        // Get products filtered by userId
        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.PRODUCTS,
            [Query.equal("userId", user.$id), Query.orderDesc("$createdAt")]
        );

        // Map documents to product format
        const products = response.documents.map((doc) => ({
            id: doc.$id,
            name: doc.name,
            description: doc.description ?? undefined,
            price: doc.price,
            tax_rate_percent: doc.taxRatePercent,
            unit_of_measure: doc.unitOfMeasure || "Stück",
            created_at: new Date(doc.$createdAt).getTime(),
            updated_at: new Date(doc.$updatedAt).getTime(),
        }));

        return NextResponse.json(products);
    } catch (error) {
        console.error("Error fetching products:", error);
        return NextResponse.json(
            { error: "Failed to fetch products" },
            { status: 500 }
        );
    }
}

// POST create new product
export async function POST(request: NextRequest) {
    try {
        const { account, databases } = await createSessionClient();

        // Get current user
        const user = await account.get();
        if (!user) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { ID } = await import("node-appwrite");

        // Create document with userId
        const doc = await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.PRODUCTS,
            ID.unique(),
            {
                userId: user.$id,
                name: body.name,
                description: body.description || null,
                price: body.price,
                taxRatePercent: body.tax_rate_percent,
                unitOfMeasure: body.unit_of_measure || "Stück",
            }
        );

        const product = {
            id: doc.$id,
            name: doc.name,
            description: doc.description ?? undefined,
            price: doc.price,
            tax_rate_percent: doc.taxRatePercent,
            unit_of_measure: doc.unitOfMeasure || "Stück",
            created_at: new Date(doc.$createdAt).getTime(),
            updated_at: new Date(doc.$updatedAt).getTime(),
        };

        return NextResponse.json(product);
    } catch (error) {
        console.error("Error creating product:", error);
        return NextResponse.json(
            { error: "Failed to create product" },
            { status: 500 }
        );
    }
}
