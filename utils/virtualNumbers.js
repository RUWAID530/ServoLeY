const { prisma } = require('../config/database');

// Assign a free virtual number to an order (on accept)
const assignVirtualNumberToOrder = async (orderId) => {
  // Check if already assigned
  const existing = await prisma.virtualAssignment.findUnique({ where: { orderId } });
  if (existing) return existing;

  // Find a free number
  const freeNumber = await prisma.virtualNumber.findFirst({ where: { isAssigned: false } });
  if (!freeNumber) throw new Error('No virtual numbers available');

  // Mark assigned and create assignment
  const assignment = await prisma.$transaction(async (tx) => {
    const updatedNumber = await tx.virtualNumber.update({
      where: { id: freeNumber.id },
      data: { isAssigned: true }
    });
    const created = await tx.virtualAssignment.create({
      data: {
        orderId,
        virtualNumberId: updatedNumber.id,
        status: 'ASSIGNED'
      }
    });
    return created;
  });
  return assignment;
};

// Release virtual number after completion/cancellation
const releaseVirtualNumberForOrder = async (orderId) => {
  const assignment = await prisma.virtualAssignment.findUnique({ where: { orderId } });
  if (!assignment) return null;

  await prisma.$transaction(async (tx) => {
    await tx.virtualNumber.update({
      where: { id: assignment.virtualNumberId },
      data: { isAssigned: false }
    });
    await tx.virtualAssignment.update({
      where: { id: assignment.id },
      data: { status: 'RELEASED', releasedAt: new Date() }
    });
  });
  return { success: true };
};

module.exports = {
  assignVirtualNumberToOrder,
  releaseVirtualNumberForOrder
};



