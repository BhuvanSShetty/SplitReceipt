// Round to two decimal places and smooth out tiny floating-point quirks.
const roundCurrency = (value) => {
  const rounded = Math.round((value + Number.EPSILON) * 100) / 100;
  return Number.isFinite(rounded) ? rounded : 0;
};

// Add up a list of amounts, treating anything missing or invalid as zero.
const sumAmounts = (items) =>
  items.reduce((total, item) => total + (Number(item.amount) || 0), 0);

// Work out the full split for the receipt based on the selected people and
// item assignments.
export const computeSplit = ({ receipt, people, assignments }) => {
  // Make sure the optional receipt fields are always arrays before we use them.
  const receiptItems = Array.isArray(receipt?.items) ? receipt.items : [];
  const taxes = Array.isArray(receipt?.taxes) ? receipt.taxes : [];
  const serviceCharges = Array.isArray(receipt?.serviceCharges)
    ? receipt.serviceCharges
    : [];

  // Clean up the people list and assignment map so the rest of the logic can
  // stay simple.
  const peopleList = Array.isArray(people) ? people : [];
  const assignmentMap = assignments || {};

  // Set up one running record per person so we can fill in their shares as we go.
  const perPerson = peopleList.map((name) => ({
    name,
    itemShares: [],
    subtotal: 0,
    taxShare: 0,
    serviceShare: 0,
    total: 0,
  }));
  const personIndex = new Map(perPerson.map((person, index) => [person.name, index]));

  // Keep track of items that nobody was assigned to.
  const unassignedItems = [];

  // Split each item between the people assigned to it.
  // The last person gets whatever is left so the total still matches exactly.
  receiptItems.forEach((item) => {
    const itemAssignment = assignmentMap[item.id] || {};
    const validAssignees = Object.entries(itemAssignment).filter(
      ([name, qty]) => personIndex.has(name) && qty > 0
    );

    if (validAssignees.length === 0) {
      unassignedItems.push({ id: item.id, name: item.name, amount: item.price });
      return;
    }

    const totalAssignedQty = validAssignees.reduce((sum, [, qty]) => sum + qty, 0);
    const itemPrice = Number(item.price) || 0;

    let assignedAmountSoFar = 0;

    validAssignees.forEach(([name, qty], idx) => {
      const index = personIndex.get(name);
      if (index === undefined) return;

      let share;
      if (idx === validAssignees.length - 1) {
        // Give the last person the remaining amount to close any rounding gap.
        share = itemPrice - assignedAmountSoFar;
      } else {
        // For everyone else, split the item by quantity and round the result.
        share = roundCurrency((itemPrice * qty) / totalAssignedQty);
        assignedAmountSoFar = roundCurrency(assignedAmountSoFar + share);
      }

      perPerson[index].itemShares.push({
        itemId: item.id,
        itemName: item.name,
        amount: roundCurrency(share),
      });
      perPerson[index].subtotal = roundCurrency(perPerson[index].subtotal + share);
    });
  });

  // Taxes and service charges are shared equally.
  // The last person again takes the remainder so everything adds up cleanly.
  const subtotalTotal = perPerson.reduce((total, person) => total + person.subtotal, 0);
  const totalTaxes = roundCurrency(sumAmounts(taxes));
  const totalService = roundCurrency(sumAmounts(serviceCharges));
  const peopleCount = perPerson.length;

  let taxSoFar = 0;
  let serviceSoFar = 0;

  perPerson.forEach((person, idx) => {
    if (peopleCount > 0) {
      if (idx === perPerson.length - 1) {
        // The final person gets the leftover tax and service amount.
        person.taxShare = roundCurrency(totalTaxes - taxSoFar);
        person.serviceShare = roundCurrency(totalService - serviceSoFar);
      } else {
        // Everyone else gets the same rounded split.
        person.taxShare = roundCurrency(totalTaxes / peopleCount);
        person.serviceShare = roundCurrency(totalService / peopleCount);
        taxSoFar = roundCurrency(taxSoFar + person.taxShare);
        serviceSoFar = roundCurrency(serviceSoFar + person.serviceShare);
      }
    }
    // Add everything together for the final amount each person owes.
    person.total = roundCurrency(person.subtotal + person.taxShare + person.serviceShare);
  });

  // Return the full split summary for the UI or API response.
  return {
    currency: receipt?.currency || 'INR',
    perPerson,
    totals: {
      items: roundCurrency(subtotalTotal),
      taxes: totalTaxes,
      serviceCharges: totalService,
      grandTotal: roundCurrency(subtotalTotal + totalTaxes + totalService),
    },
    unassignedItems,
  };
};
