import { generateAccessToken, paypal } from "../lib/paypal"


test('Genereate access token', async () => {
    const tokenResponse: string = await generateAccessToken();

    console.log(tokenResponse);

    expect(typeof tokenResponse).toBe('string');
    expect(tokenResponse.length).toBeGreaterThan(0);

})

test("Create Paypal Order", async () => {
    const price = 10;

    const response = await paypal.createOrder(price);
    console.log(response);

    expect(response).toHaveProperty('id');
    expect(response).toHaveProperty('status');
    expect(response.status).toBe('CREATED');
});

test('Simulate capturing a payment from an order', async () => {
    const orderId = '100';

    const mockPayment = jest
    .spyOn(paypal, 'capturePayment')
    .mockResolvedValue({
        status: 'COMPLETED'
    });

    const response = await paypal.capturePayment(orderId);

    expect(response).toHaveProperty('status', 'COMPLETED');

    mockPayment.mockRestore();
}) 