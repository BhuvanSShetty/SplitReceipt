const roundCurrency = (value) => {
  const rounded = Math.round((value + Number.EPSILON) * 100) / 100;
  return Number.isFinite(rounded) ? rounded : 0;
};

const sumAmounts = (items) =>
  items.reduce((total, item) => total + (Number(item.amount) || 0), 0);

export const computeSplit = ({ receipt, people, assignments }) => {
  const receiptItems = Array.isArray(receipt?.items) ? receipt.items : [];
  const taxes = Array.isArray(receipt?.taxes) ? receipt.taxes : [];
  const serviceCharges = Array.isArray(receipt?.serviceCharges)
    ? receipt.serviceCharges
    : [];

  const peopleList = Array.isArray(people) ? people : [];
  const assignmentMap = assignments || {};

  const perPerson = peopleList.map((name) => ({
    name,
    itemShares: [],
    subtotal: 0,
    taxShare: 0,
    serviceShare: 0,
    total: 0,
  }));
  const personIndex = new Map(perPerson.map((person, index) => [person.name, index]));

  const unassignedItems = [];

  receiptItems.forEach((item) => {
    const assignedTo = Array.isArray(assignmentMap[item.id])
      ? assignmentMap[item.id]
      : [];
    const validAssignees = assignedTo.filter((name) => personIndex.has(name));

    if (validAssignees.length === 0) {
      unassignedItems.push({ id: item.id, name: item.name, amount: item.price });
      return;
    }

    const share = (Number(item.price) || 0) / validAssignees.length;

    validAssignees.forEach((name) => {
      const index = personIndex.get(name);
      if (index === undefined) return;
      perPerson[index].itemShares.push({
        itemId: item.id,
        itemName: item.name,
        amount: roundCurrency(share),
      });
      perPerson[index].subtotal = roundCurrency(perPerson[index].subtotal + share);
    });
  });

  const subtotalTotal = perPerson.reduce((total, person) => total + person.subtotal, 0);
  const totalTaxes = roundCurrency(sumAmounts(taxes));
  const totalService = roundCurrency(sumAmounts(serviceCharges));
  const peopleCount = perPerson.length;

  perPerson.forEach((person) => {
    if (peopleCount > 0) {
      person.taxShare = roundCurrency(totalTaxes / peopleCount);
      person.serviceShare = roundCurrency(totalService / peopleCount);
    }
    person.total = roundCurrency(person.subtotal + person.taxShare + person.serviceShare);
  });

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
