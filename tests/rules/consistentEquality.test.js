import { QMLLinter } from '../../src/index.js';

describe('consistentEquality rule', () => {
    let linter;

    beforeEach(() => {
        linter = new QMLLinter({
            rules: {
                consistentEquality: { 
                    enabled: true,
                    config: 'strict'  // Enforce === and !==
                }
            }
        });
    });

    test('should detect loose equality operators in property bindings', () => {
        const qmlContent = `
            import QtQuick 2.15
            
            Rectangle {
                id: root
                property bool isActive: false
                
                visible: isActive == true  // Should trigger warning
            }
        `;
        
        const issues = linter.lint(qmlContent, 'test.qml');
        expect(issues).toHaveLength(1);
        expect(issues[0].message).toContain('Use === instead of ==');
    });

    test('should detect loose inequality operators in JavaScript blocks', () => {
        const qmlContent = `
            import QtQuick 2.15
            
            Rectangle {
                function checkCondition(value) {
                    if (value != null) {  // Should trigger warning
                        return true;
                    }
                    return false;
                }
            }
        `;
        
        const issues = linter.lint(qmlContent, 'test.qml');
        expect(issues).toHaveLength(1);
        expect(issues[0].message).toContain('Use !== instead of !=');
    });

    test('should pass when using strict equality operators', () => {
        const qmlContent = `
            import QtQuick 2.15
            
            Rectangle {
                id: root
                property bool isActive: false
                
                function checkValue(val) {
                    if (val === undefined) {
                        return false;
                    }
                    return val !== null;
                }
                
                visible: isActive === true
            }
        `;
        
        const issues = linter.lint(qmlContent, 'test.qml');
        expect(issues).toHaveLength(0);
    });

    test('should check equality operators in conditional expressions', () => {
        const qmlContent = `
            import QtQuick 2.15
            
            Rectangle {
                width: parent.width
                height: parent.height
                
                Text {
                    text: parent.width == 100 ? "Small" : "Large"  // Should trigger warning
                }
                
                MouseArea {
                    anchors.fill: parent
                    onClicked: {
                        if (parent.height != 100) {  // Should trigger warning
                            console.log("Height changed");
                        }
                    }
                }
            }
        `;
        
        const issues = linter.lint(qmlContent, 'test.qml');
        expect(issues).toHaveLength(2);
    });

    test('should respect config when set to loose equality', () => {
        const looseEqualityLinter = new QMLLinter({
            rules: {
                consistentEquality: { 
                    enabled: true,
                    config: 'loose'  // Allow == and !=
                }
            }
        });

        const qmlContent = `
            import QtQuick 2.15
            
            Rectangle {
                property bool isActive: false
                
                visible: isActive === true  // Should trigger warning in loose mode
                
                function check(val) {
                    return val !== null;  // Should trigger warning in loose mode
                }
            }
        `;
        
        const issues = looseEqualityLinter.lint(qmlContent, 'test.qml');
        expect(issues).toHaveLength(2);
        expect(issues[0].message).toContain('Use == instead of ===');
    });
});
