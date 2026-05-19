describe('Test Runner', () =>{
    it('should run basic tests', () => {
        expect(true).toBe(true);
    })

    it('should handle simple arithmetic', () => {
        expect(2+2).toBe(4);
        expect(10-5).toBe(5);
        expect(3*4).toBe(12);
    });

    it('should work with strings', () => {
        expect('hello').toBe('hello')
         expect('hello' + ' world').toBe('hello world');
    });

    it('should work with arrays', ()=>{
        const arr = [1, 2, 3];
        expect(arr).toHaveLength(3);
        expect(arr).toContain(2);
    })

    it('should work with objects', () => {
        const obj = {name:'test', value: 42};
        expect(obj).toHaveProperty('name');
        expect(obj.name).toBe('test');
        expect(obj.value).toBe(42);
    })

    it('should test deep equality between objects', ()=>{
        const obj1 = {
      id: 1,
      user: {
        name: 'John',
        age: 30,
        preferences: {
          theme: 'dark',
          notifications: true
        }
      },
      tags: ['developer', 'typescript']
    };
    const obj2 = {
      id: 1,
      user: {
        name: 'John',
        age: 30,
        preferences: {
          theme: 'dark',
          notifications: true
        }
      },
      tags: ['developer', 'typescript']
    };
     const obj3 = {
      id: 1,
      user: {
        name: 'John',
        age: 31,
        preferences: {
          theme: 'dark',
          notifications: true
        }
      },
      tags: ['developer', 'typescript']
    };

    // Deep equality assertion
    expect(obj1).toEqual(obj2);
    expect(obj1).not.toEqual(obj3);

    // Reference equality (should be false)
    expect(obj1).not.toBe(obj2);
    })
})