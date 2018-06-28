var $ = require('ep_etherpad-lite/static/js/rjquery').$;

/*
  Get position where caret should be placed -- on **pad outer**.
  We cannot place it on pad inner because that messes up with ACE.

  Strategy:
    1. Create a clone (on pad outer) of the entire line where caret
       is (on pad inner). Use same font, same size, etc, so we have
       an exact copy of every single char of the line;
    2. On the column where the caret is, insert a <span> -- to be
       used as a reference for the position where caret should be;
    3. Place the clone exactly on top of the original line, as if
       one was overlapping the other;
    4. Get the position on pad outer of the <span> created on step #2;
    5. Remove the clone, as it is not needed anymore.
*/
exports.getCaretPosition = function(caretLine, caretColumn) {
  // Step 1:
  var $clonedLine     = cloneLineWithStyle(caretLine);
  var nodeInfo        = getNodeInfoWhereCaretIs(caretColumn, $clonedLine);
  var counter         = nodeInfo.counter;
  var cloneTextNode   = nodeInfo.node;
  var cloneParentNode = cloneTextNode.parentNode;

  // Step 2:
  var secondHalfOfTextNode = splitNodeOnCaretPosition(cloneTextNode, counter, caretColumn);
  var span = createHelperSpan();
  cloneParentNode.insertBefore(span, secondHalfOfTextNode); // Insert element at caret position

  // Step 3:
  // In order to see where the node we added is, we need to insert it into the document
  $clonedLine.appendTo(getPadOuter().find('#outerdocbody'));

  // Step 4:
  var caretPosition = $(span).offset();
  var scrollYPos = getPadOuter().scrollTop();

  // Step 5:
  $clonedLine.remove(); // Clean up again

  return {
    // Offset gives me the offset to the root document (not the iframe)
    // so after scrolling down, top becomes less or even negative.
    // So add the offset to get back where it belongs.
    top: (caretPosition.top + scrollYPos),
    left: caretPosition.left
  };
}

var getNodeInfoWhereCaretIs = function(caretColumn, $caretDiv) {
  // $textNodes holds all text nodes that are found inside the div
  var $textNodes = $caretDiv.find('*').contents().filter(function() {
    return this.nodeType === Node.TEXT_NODE;
  });

  // Now we want to find the text node the caret is in
  var counter = 0; // Holds the added length of text of all text nodes parsed so far
  var childNode = null; // The node caret is in

  $textNodes.each(function(index, element) {
    counter = counter + element.nodeValue.length; // Add up to the length of text nodes parsed
    childNode = element;

    // Found node where caret is
    if(counter >= caretColumn) {
      return false; // Stop .each by returning false
    }
  });

  if (childNode === null) {
    // There was no text node inside $caretDiv, so caret is on an empty line.
    // Empty lines on Etherpad always have a <br>, so we get its parent.
    // We cannot use br itself because if we insert a span inside the br we
    // get weird positions on screen
    childNode = $caretDiv.find('br').get(0);
  }

  return {
    node: childNode,
    counter: counter,
  };
}

var splitNodeOnCaretPosition = function(cloneTextNode, counter, caretColumn) {
  // cloneTextNode is an empty line (the <br> inside the <div>), so we don't need to split anything
  if (cloneTextNode.nodeType !== Node.TEXT_NODE) return cloneTextNode;

  var targetNodeText = cloneTextNode.nodeValue || ''; // Text of the subnode our caret is in
  // How many characters are between the start of the element and the caret?
  var leftoverString = targetNodeText.length - (counter - caretColumn);
  var secondHalf = cloneTextNode.splitText(leftoverString);
  return secondHalf;
}

// Clone line with caret and copy its style
var cloneLineWithStyle = function(caretLine) {
  var $caretDiv = getPadInner().find('#innerdocbody > div:nth-child(' + caretLine + ')');

  // Position of editor relative to client. Needed in final positioning
  var $padInnerFrame = getPadOuter().find('iframe[name="ace_inner"]');
  var innerEditorPosition = $padInnerFrame[0].getBoundingClientRect();

  var childNodePosition = $caretDiv.position();
  var computedCSS = window.getComputedStyle($caretDiv[0]);
  var $clonedLine = $caretDiv.clone();

  // Apply all styles to it
  $clonedLine.attr('id','tempPosId'); // Change the id just in case...
  $clonedLine.css({
    position: 'absolute',
    top: childNodePosition.top + innerEditorPosition.top + 'px',
    left: childNodePosition.left + innerEditorPosition.left + 'px',
    background: 'gray',
    color: 'black',
    display: 'block',
    // get the correct position when caret is not on the first line of $caretDiv
    "white-space":"normal",
    "word-wrap":"break-word",
  });

  // Make sure $clonedLine and all its inner nodes have the same dimensions of
  // the original nodes
  copyStyles($caretDiv[0], $clonedLine[0]);
  var $originalNodes = $caretDiv.find('*');
  var $clonedNodes = $clonedLine.find('*');
  for (var i = 0; i < $originalNodes.length; i++) {
    copyStyles($originalNodes[i], $clonedNodes[i]);
  }

  return $clonedLine;
}

var copyStyles = function(fromNode, toNode) {
  var computedCSS = window.getComputedStyle(fromNode);

  $(toNode).css({
    width:computedCSS.width,
    height:computedCSS.height,
    margin:computedCSS.margin,
    padding:computedCSS.padding,
    fontSize:computedCSS.fontSize,
    fontWeight:computedCSS.fontWeight,
    fontFamily:computedCSS.fontFamily,
    lineHeight:computedCSS.lineHeight,
  });
}

var createHelperSpan = function() {
  var span = document.createElement('span');
  // put some invisible content (vertical tab), so span is always displayed the same way
  // (an empty span might be displayed above text on some scenarios)
  span.appendChild(document.createTextNode('\x0b'));
  return span;
}

// Easier access to outer pad
var padOuter;
var getPadOuter = function() {
  padOuter = padOuter || $('iframe[name="ace_outer"]').contents();
  return padOuter;
}

// Easier access to inner pad
var padInner;
var getPadInner = function() {
  padInner = padInner || getPadOuter().find('iframe[name="ace_inner"]').contents();
  return padInner;
}
