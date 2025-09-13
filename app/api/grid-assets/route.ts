import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const includeDeleted = searchParams.get('includeDeleted') === 'true';

  try {
    const gridAssets = await prisma.gridAsset.findMany({
      where: {
        deleted: includeDeleted ? undefined : false,
      },
    });
    return NextResponse.json({ gridAssets });
  } catch (error) {
    console.error("Failed to fetch grid assets:", error);
    return NextResponse.json({ error: "Failed to fetch grid assets" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, type, status, latitude, longitude, address, voltage, load, capacity, site, zone, woreda, category, nameLink } = body;

    const newAsset = await prisma.gridAsset.create({
      data: {
        name,
        type,
        status,
        latitude,
        longitude,
        address,
        voltage,
        load,
        capacity,
        site,
        zone,
        woreda,
        category,
        nameLink,
      },
    });

    return NextResponse.json({ asset: newAsset }, { status: 201 });
  } catch (error) {
    console.error("Failed to create grid asset:", error);
    return NextResponse.json({ error: "Failed to create grid asset" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, ...data } = body;

    const updatedAsset = await prisma.gridAsset.update({
      where: { id },
      data,
    });

    return NextResponse.json({ asset: updatedAsset });
  } catch (error) {
    console.error("Failed to update grid asset:", error);
    return NextResponse.json({ error: "Failed to update grid asset" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, permanent } = body;

    if (permanent) {
      await prisma.gridAsset.delete({
        where: { id },
      });
      return NextResponse.json({ message: "Grid asset permanently deleted successfully" });
    } else {
      await prisma.gridAsset.update({
        where: { id },
        data: { deleted: true },
      });
      return NextResponse.json({ message: "Grid asset soft deleted successfully" });
    }
  } catch (error) {
    console.error("Failed to delete grid asset:", error);
    return NextResponse.json({ error: "Failed to delete grid asset" }, { status: 500 });
  }
}