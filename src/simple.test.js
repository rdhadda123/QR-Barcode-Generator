// simple.test.js to see if testing is working
/**
 * @jest-environment jsdom
 */
test('jsdom environment is working', () => {
    expect(typeof document).toBe('object');
    document.body.innerHTML = '<div>Test</div>';
    expect(document.body.innerHTML).toBe('<div>Test</div>');
  });