<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Grocery Shopping List - {{ $user->name }}</title>
    <style>
        @page {
            margin: 20px 25px;
        }
        body {
            font-family: 'DejaVu Sans', sans-serif;
            color: #1e293b;
            font-size: 11px;
            line-height: 1.4;
            margin: 0;
            padding: 0;
        }
        .header {
            background: linear-gradient(135deg, #059669, #10b981);
            background-color: #059669;
            color: #ffffff;
            padding: 18px 22px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .header h1 {
            margin: 0;
            font-size: 20px;
            font-weight: bold;
            letter-spacing: 0.5px;
        }
        .header p {
            margin: 5px 0 0 0;
            font-size: 11px;
            color: #ecfdf5;
            opacity: 0.95;
        }
        .meta-bar {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 6px;
            padding: 10px 14px;
            margin-bottom: 18px;
            display: table;
            width: 100%;
            box-sizing: border-box;
        }
        .meta-col {
            display: table-cell;
            width: 33.33%;
            vertical-align: middle;
        }
        .meta-label {
            font-size: 9px;
            text-transform: uppercase;
            color: #166534;
            font-weight: bold;
            margin-bottom: 2px;
        }
        .meta-val {
            font-size: 12px;
            font-weight: bold;
            color: #064e3b;
        }
        .category-block {
            margin-bottom: 16px;
            page-break-inside: avoid;
        }
        .category-title {
            font-size: 12px;
            font-weight: bold;
            color: #065f46;
            background: #ecfdf5;
            border-left: 4px solid #059669;
            padding: 5px 10px;
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        table.grocery-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10.5px;
        }
        table.grocery-table th {
            background: #f8fafc;
            color: #475569;
            text-align: left;
            padding: 5px 8px;
            font-weight: bold;
            font-size: 9.5px;
            text-transform: uppercase;
            border-bottom: 1px solid #cbd5e1;
        }
        table.grocery-table td {
            padding: 5px 8px;
            border-bottom: 1px solid #e2e8f0;
            vertical-align: middle;
        }
        table.grocery-table tr:nth-child(even) td {
            background-color: #fafafa;
        }
        .checkbox-box {
            display: inline-block;
            width: 13px;
            height: 13px;
            border: 1.5px solid #94a3b8;
            border-radius: 2px;
            text-align: center;
            line-height: 12px;
            font-size: 10px;
            font-weight: bold;
            color: #059669;
        }
        .checkbox-box.checked {
            background-color: #d1fae5;
            border-color: #059669;
        }
        .item-name {
            font-weight: 600;
            color: #1e293b;
        }
        .item-name.bought {
            text-decoration: line-through;
            color: #94a3b8;
        }
        .qty-badge {
            font-weight: bold;
            color: #047857;
            font-size: 11px;
        }
        .footer {
            margin-top: 25px;
            padding-top: 10px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            font-size: 9.5px;
            color: #64748b;
        }
        .empty-msg {
            text-align: center;
            padding: 40px 20px;
            color: #64748b;
            font-size: 12px;
        }
    </style>
</head>
<body>

    <div class="header">
        <h1>Consolidated Grocery Shopping List</h1>
        <p>Prepared for {{ $user->name }} &bull; Diet &amp; Nutrition Planner</p>
    </div>

    <div class="meta-bar">
        <div class="meta-col">
            <div class="meta-label">Plan Period</div>
            <div class="meta-val">{{ $dateRange }} ({{ $daysFound }} days)</div>
        </div>
        <div class="meta-col" style="text-align: center;">
            <div class="meta-label">Total Unique Items</div>
            <div class="meta-val">{{ count($list) }} Ingredients</div>
        </div>
        <div class="meta-col" style="text-align: right;">
            <div class="meta-label">Generated Date</div>
            <div class="meta-val">{{ date('M j, Y') }}</div>
        </div>
    </div>

    @if(count($grouped) === 0)
        <div class="empty-msg">
            <p>No grocery items found for the selected meal plan period.</p>
            <p>Generate a meal plan in your Diet Planner to automatically populate your weekly groceries!</p>
        </div>
    @else
        @foreach($grouped as $category => $items)
            <div class="category-block">
                <div class="category-title">{{ $category }} ({{ count($items) }})</div>
                <table class="grocery-table">
                    <thead>
                        <tr>
                            <th style="width: 32px; text-align: center;">Check</th>
                            <th>Item Name</th>
                            <th style="width: 110px; text-align: right;">Quantity Needed</th>
                            <th style="width: 100px; text-align: right;">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($items as $item)
                            <tr>
                                <td style="text-align: center;">
                                    @if(!empty($item['is_bought']))
                                        <div class="checkbox-box checked">&#10003;</div>
                                    @else
                                        <div class="checkbox-box">&nbsp;</div>
                                    @endif
                                </td>
                                <td>
                                    <span class="item-name {{ !empty($item['is_bought']) ? 'bought' : '' }}">
                                        {{ $item['name'] }}
                                    </span>
                                </td>
                                <td style="text-align: right;">
                                    <span class="qty-badge">{{ $item['total_quantity'] }} {{ strtoupper($item['unit']) }}</span>
                                </td>
                                <td style="text-align: right; color: {{ !empty($item['is_bought']) ? '#059669' : '#64748b' }}; font-size: 9.5px; font-weight: bold;">
                                    {{ !empty($item['is_bought']) ? 'Purchased' : 'Pending' }}
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        @endforeach
    @endif

    <div class="footer">
        Generated by <strong>Diet &amp; Nutrition Planner</strong> &bull; Take this list to the supermarket or share it with family on WhatsApp.
    </div>

</body>
</html>
