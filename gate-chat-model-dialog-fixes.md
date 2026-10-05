# Gate Chat: "Choose a model" dialog spacing fixes

Prompt for your agent:

Two spacing fixes in the Gate Chat "Choose a model" dialog.

File: `apps/dashboard-web/src/components/chat/chat-model-selector.tsx`

1. Search input should push the provider dropdown to the right padding.
   Right now the "All providers" trigger is narrower than its fixed 11rem grid
   column, so it ends ~49px short of the content edge (the tabs underline and
   the model list border run past it).
   - Line ~343: change `sm:grid-cols-[minmax(0,1fr)_11rem]`
     to `sm:grid-cols-[minmax(0,1fr)_auto]`.
   - Result: the search grows and the dropdown's right edge lines up with the
     tabs underline and the list box border.

2. Move the favourite star column closer to the scroll box edge.
   Only the scroll indicator needs room, so the star icon should sit 16px from
   the list box's inner right edge. Today it sits ~57px away.
   - Line ~259, the model row `<li>`: change `px-3` to `pr-0 pl-3`
     (keep the left padding; the list's own `pr-2` stays as scrollbar room).
   - Lines ~309-313: move the selected-model `<Check>` icon from AFTER the
     favourite star button to BEFORE it (directly after the row's main
     `</button>` at line ~292). Do not remove it. It still shows on the
     selected row, between the capability icons and the star.
   - Result at sm+: star icon edge to list inner edge =
     8 (list pr-2) + 0 (row pr-0) + 8 (16px icon centred in the 32px button) = 16px.
     Every row's star stays on one column.

Verify at desktop width: the dropdown's right edge equals the list box's right
edge, and the star icon sits 16px from the list's inner right edge.
